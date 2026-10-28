
const prisma = require("../data/prisma");

async function listarEstoque(req, res) {
  try {
    const discos = await prisma.disco.findMany({
      select: {
        id: true,
        titulo: true,
        artista: true,
        quantidadeEstoque: true,
        estoqueMinimo: true
      },
      orderBy: {
        titulo: "asc"
      }
    });

    const resultado = discos.map((disco) => ({
      ...disco,
      estoqueBaixo: disco.quantidadeEstoque <= disco.estoqueMinimo
    }));

    return res.json(resultado);
  } catch (erro) {
    console.error("Erro ao listar estoque:", erro);

    return res.status(500).json({
      erro: "Erro ao consultar estoque."
    });
  }
}

async function listarHistorico(req, res) {
  try {
    const movimentacoes = await prisma.movimentacaoEstoque.findMany({
      include: {
        disco: {
          select: {
            id: true,
            titulo: true,
            artista: true
          }
        },
        usuario: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: {
        data: "desc"
      }
    });

    return res.json(movimentacoes);
  } catch (erro) {
    console.error("Erro ao listar histórico:", erro);

    return res.status(500).json({
      erro: "Erro ao consultar histórico de movimentações."
    });
  }
}


async function registrarMovimentacao(req, res) {
  try {
    const {
      discoId,
      usuarioId,
      tipo,
      quantidade,
      observacao,
      data
    } = req.body;

    const idDisco = Number(discoId);
    const idUsuario = Number(usuarioId);
    const qtd = Number(quantidade);

  
    if (
      !Number.isInteger(idDisco) ||
      idDisco <= 0 ||
      !Number.isInteger(idUsuario) ||
      idUsuario <= 0
    ) {
      return res.status(400).json({
        erro: "Informe um disco e um usuário válidos."
      });
    }

    if (!["ENTRADA", "SAIDA"].includes(tipo)) {
      return res.status(400).json({
        erro: "O tipo deve ser ENTRADA ou SAIDA."
      });
    }

    if (!Number.isInteger(qtd) || qtd <= 0) {
      return res.status(400).json({
        erro: "A quantidade deve ser um número inteiro maior que zero."
      });
    }

    let dataMovimentacao;

    if (data !== undefined) {
      dataMovimentacao = new Date(data);

      if (Number.isNaN(dataMovimentacao.getTime())) {
        return res.status(400).json({
          erro: "Informe uma data de movimentação válida."
        });
      }
    }

    const movimentacao = await prisma.$transaction(async (tx) => {
      const disco = await tx.disco.findUnique({
        where: {
          id: idDisco
        }
      });

      if (!disco) {
        const erro = new Error("Disco não encontrado.");
        erro.status = 404;
        throw erro;
      }

      const usuario = await tx.usuario.findUnique({
        where: {
          id: idUsuario
        }
      });

      if (!usuario) {
        const erro = new Error("Usuário não encontrado.");
        erro.status = 404;
        throw erro;
      }

      if (tipo === "SAIDA" && disco.quantidadeEstoque < qtd) {
        const erro = new Error(
          "Estoque insuficiente para essa saída."
        );

        erro.status = 400;
        throw erro;
      }

      const novaQuantidade =
        tipo === "ENTRADA"
          ? disco.quantidadeEstoque + qtd
          : disco.quantidadeEstoque - qtd;

      await tx.disco.update({
        where: {
          id: idDisco
        },
        data: {
          quantidadeEstoque: novaQuantidade
        }
      });

      return tx.movimentacaoEstoque.create({
        data: {
          discoId: idDisco,
          usuarioId: idUsuario,
          tipo,
          quantidade: qtd,
          observacao: observacao || null,

          ...(dataMovimentacao
            ? { data: dataMovimentacao }
            : {})
        },
        include: {
          disco: {
            select: {
              id: true,
              titulo: true,
              artista: true
            }
          },
          usuario: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      });
    });

    return res.status(201).json(movimentacao);
  } catch (erro) {
    if (erro.status) {
      return res.status(erro.status).json({
        erro: erro.message
      });
    }

    console.error("Erro ao registrar movimentação:", erro);

    return res.status(500).json({
      erro: "Erro ao registrar movimentação de estoque."
    });
  }
}

module.exports = {
  listarEstoque,
  listarHistorico,
  registrarMovimentacao
};
