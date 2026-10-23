const prisma = require("../data/prisma");

async function listarDiscos(req, res) {
  try {
    const discos = await prisma.disco.findMany({
      orderBy: { titulo: "asc" }
    });

    return res.json(discos);
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao listar discos." });
  }
}

async function buscarDiscoPorId(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const disco = await prisma.disco.findUnique({
      where: { id }
    });

    if (!disco) {
      return res.status(404).json({ erro: "Disco não encontrado." });
    }

    return res.json(disco);
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao buscar disco." });
  }
}

async function cadastrarDisco(req, res) {
  try {
    const {
      titulo,
      artista,
      genero,
      anoLancamento,
      preco,
      quantidadeEstoque,
      estoqueMinimo,
      descricao
    } = req.body;

    if (!titulo || !artista || !genero || preco === undefined) {
      return res.status(400).json({
        erro: "Título, artista, gênero e preço são obrigatórios."
      });
    }

    const precoNumerico = Number(preco);
    const quantidade = quantidadeEstoque === undefined
      ? 0
      : Number(quantidadeEstoque);
    const minimo = estoqueMinimo === undefined
      ? 5
      : Number(estoqueMinimo);

    if (!Number.isFinite(precoNumerico) || precoNumerico < 0) {
      return res.status(400).json({ erro: "Preço inválido." });
    }

    if (
      !Number.isInteger(quantidade) ||
      quantidade < 0 ||
      !Number.isInteger(minimo) ||
      minimo < 0
    ) {
      return res.status(400).json({
        erro: "Estoque e estoque mínimo devem ser números inteiros não negativos."
      });
    }

    if (
      anoLancamento !== undefined &&
      anoLancamento !== null &&
      anoLancamento !== "" &&
      (!Number.isInteger(Number(anoLancamento)) ||
        Number(anoLancamento) < 0)
    ) {
      return res.status(400).json({ erro: "Ano de lançamento inválido." });
    }

    const disco = await prisma.disco.create({
      data: {
        titulo: String(titulo).trim(),
        artista: String(artista).trim(),
        genero: String(genero).trim(),
        anoLancamento:
          anoLancamento === undefined ||
          anoLancamento === null ||
          anoLancamento === ""
            ? null
            : Number(anoLancamento),
        preco: precoNumerico,
        quantidadeEstoque: quantidade,
        estoqueMinimo: minimo,
        descricao: descricao || null
      }
    });

    return res.status(201).json(disco);
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao cadastrar disco." });
  }
}

async function atualizarDisco(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const existente = await prisma.disco.findUnique({ where: { id } });

    if (!existente) {
      return res.status(404).json({ erro: "Disco não encontrado." });
    }

    const {
      titulo,
      artista,
      genero,
      anoLancamento,
      preco,
      estoqueMinimo,
      descricao
    } = req.body;

    const dados = {};

    if (titulo !== undefined) {
      if (!String(titulo).trim()) {
        return res.status(400).json({ erro: "Título não pode ficar vazio." });
      }
      dados.titulo = String(titulo).trim();
    }

    if (artista !== undefined) {
      if (!String(artista).trim()) {
        return res.status(400).json({ erro: "Artista não pode ficar vazio." });
      }
      dados.artista = String(artista).trim();
    }

    if (genero !== undefined) {
      if (!String(genero).trim()) {
        return res.status(400).json({ erro: "Gênero não pode ficar vazio." });
      }
      dados.genero = String(genero).trim();
    }

    if (preco !== undefined) {
      const valor = Number(preco);

      if (!Number.isFinite(valor) || valor < 0) {
        return res.status(400).json({ erro: "Preço inválido." });
      }

      dados.preco = valor;
    }

    if (estoqueMinimo !== undefined) {
      const minimo = Number(estoqueMinimo);

      if (!Number.isInteger(minimo) || minimo < 0) {
        return res.status(400).json({ erro: "Estoque mínimo inválido." });
      }

      dados.estoqueMinimo = minimo;
    }

    if (anoLancamento !== undefined) {
      if (anoLancamento === null || anoLancamento === "") {
        dados.anoLancamento = null;
      } else {
        const ano = Number(anoLancamento);

        if (!Number.isInteger(ano) || ano < 0) {
          return res.status(400).json({ erro: "Ano de lançamento inválido." });
        }

        dados.anoLancamento = ano;
      }
    }

    if (descricao !== undefined) {
      dados.descricao = descricao || null;
    }

    const disco = await prisma.disco.update({
      where: { id },
      data: dados
    });

    return res.json(disco);
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao atualizar disco." });
  }
}

async function excluirDisco(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const disco = await prisma.disco.findUnique({ where: { id } });

    if (!disco) {
      return res.status(404).json({ erro: "Disco não encontrado." });
    }

    await prisma.disco.delete({ where: { id } });

    return res.json({ mensagem: "Disco excluído com sucesso." });
  } catch (erro) {
    if (erro.code === "P2003" || erro.code === "P2014") {
      return res.status(409).json({
        erro: "Não é possível excluir este disco porque ele possui movimentações ou vendas vinculadas."
      });
    }

    return res.status(500).json({ erro: "Erro ao excluir disco." });
  }
}

module.exports = {
  listarDiscos,
  buscarDiscoPorId,
  cadastrarDisco,
  atualizarDisco,
  excluirDisco
};