const prisma = require("../data/prisma");

async function listarVendas(req, res) {
  try {
    const vendas = await prisma.venda.findMany({
      include: {
        usuario: {
          select: { id: true, nome: true }
        },
        itens: {
          include: {
            disco: {
              select: { id: true, titulo: true, artista: true }
            }
          }
        }
      },
      orderBy: { data: "desc" }
    });

    return res.json(vendas);
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao listar vendas." });
  }
}

async function buscarVendaPorId(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { id: true, nome: true }
        },
        itens: {
          include: { disco: true }
        }
      }
    });

    if (!venda) {
      return res.status(404).json({ erro: "Venda não encontrada." });
    }

    return res.json(venda);
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao buscar venda." });
  }
}

async function registrarVenda(req, res) {
  try {
    const { usuarioId, itens } = req.body;
    const idUsuario = Number(usuarioId);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(400).json({
        erro: "Informe um usuarioId válido."
      });
    }

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        erro: "A venda precisa ter pelo menos um disco."
      });
    }

    const itensValidados = [];

    for (const item of itens) {
      const discoId = Number(item.discoId);
      const quantidade = Number(item.quantidade);

      if (
        !Number.isInteger(discoId) || discoId <= 0 ||
        !Number.isInteger(quantidade) || quantidade <= 0
      ) {
        return res.status(400).json({
          erro: "Cada item precisa de discoId e quantidade válidos."
        });
      }

      const existente = itensValidados.find(
        (i) => i.discoId === discoId
      );

      if (existente) {
        existente.quantidade += quantidade;
      } else {
        itensValidados.push({ discoId, quantidade });
      }
    }

    const venda = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findUnique({
        where: { id: idUsuario }
      });

      if (!usuario) {
        const erro = new Error("Usuário não encontrado.");
        erro.status = 404;
        throw erro;
      }

      const itensVenda = [];
      let valorTotal = 0;

      for (const item of itensValidados) {
        const disco = await tx.disco.findUnique({
          where: { id: item.discoId }
        });

        if (!disco) {
          const erro = new Error(
            `Disco de ID ${item.discoId} não encontrado.`
          );
          erro.status = 404;
          throw erro;
        }

        if (disco.quantidadeEstoque < item.quantidade) {
          const erro = new Error(
            `Estoque insuficiente para o disco "${disco.titulo}".`
          );
          erro.status = 400;
          throw erro;
        }

        const precoUnitario = Number(disco.preco);
        const subtotal = Number(
          (precoUnitario * item.quantidade).toFixed(2)
        );

        valorTotal = Number((valorTotal + subtotal).toFixed(2));

        itensVenda.push({
          discoId: disco.id,
          quantidade: item.quantidade,
          precoUnitario,
          subtotal
        });
      }

      const novaVenda = await tx.venda.create({
        data: {
          usuarioId: idUsuario,
          valorTotal,
          itens: {
            create: itensVenda
          }
        }
      });

      for (const item of itensVenda) {
        await tx.disco.update({
          where: { id: item.discoId },
          data: {
            quantidadeEstoque: {
              decrement: item.quantidade
            }
          }
        });

        await tx.movimentacaoEstoque.create({
          data: {
            discoId: item.discoId,
            usuarioId: idUsuario,
            tipo: "SAIDA",
            quantidade: item.quantidade,
            observacao: `Saída referente à venda ${novaVenda.id}`
          }
        });
      }

      return tx.venda.findUnique({
        where: { id: novaVenda.id },
        include: {
          usuario: {
            select: { id: true, nome: true }
          },
          itens: {
            include: {
              disco: {
                select: { id: true, titulo: true, artista: true }
              }
            }
          }
        }
      });
    });

    return res.status(201).json(venda);
  } catch (erro) {
    if (erro.status) {
      return res.status(erro.status).json({ erro: erro.message });
    }

    return res.status(500).json({ erro: "Erro ao registrar venda." });
  }
}

async function cancelarVenda(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const venda = await prisma.$transaction(async (tx) => {
      const vendaExistente = await tx.venda.findUnique({
        where: { id },
        include: { itens: true }
      });

      if (!vendaExistente) {
        const erro = new Error("Venda não encontrada.");
        erro.status = 404;
        throw erro;
      }

      if (vendaExistente.status === "CANCELADA") {
        const erro = new Error("Esta venda já foi cancelada.");
        erro.status = 409;
        throw erro;
      }

      for (const item of vendaExistente.itens) {
        await tx.disco.update({
          where: { id: item.discoId },
          data: {
            quantidadeEstoque: {
              increment: item.quantidade
            }
          }
        });

        await tx.movimentacaoEstoque.create({
          data: {
            discoId: item.discoId,
            usuarioId: vendaExistente.usuarioId,
            tipo: "ENTRADA",
            quantidade: item.quantidade,
            observacao: `Devolução referente ao cancelamento da venda ${id}`
          }
        });
      }

      return tx.venda.update({
        where: { id },
        data: { status: "CANCELADA" },
        include: {
          usuario: {
            select: { id: true, nome: true }
          },
          itens: {
            include: {
              disco: {
                select: { id: true, titulo: true, artista: true }
              }
            }
          }
        }
      });
    });

    return res.json({
      mensagem: "Venda cancelada e estoque atualizado.",
      venda
    });
  } catch (erro) {
    if (erro.status) {
      return res.status(erro.status).json({ erro: erro.message });
    }

    return res.status(500).json({ erro: "Erro ao cancelar venda." });
  }
}

module.exports = {
  listarVendas,
  buscarVendaPorId,
  registrarVenda,
  cancelarVenda
};