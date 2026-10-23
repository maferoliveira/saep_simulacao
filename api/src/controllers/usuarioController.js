
const prisma = require("../data/prisma");
const bcrypt = require("bcryptjs");

async function listarUsuarios(req, res) {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        criadoEm: true
      },
      orderBy: { nome: "asc" }
    });

    return res.json(usuarios);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao listar usuários."
    });
  }
}

async function buscarUsuarioPorId(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        erro: "ID inválido."
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        criadoEm: true
      }
    });

    if (!usuario) {
      return res.status(404).json({
        erro: "Usuário não encontrado."
      });
    }

    return res.json(usuario);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao buscar usuário."
    });
  }
}

async function cadastrarUsuario(req, res) {
  try {
    const { nome, email, senha, tipo } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Nome, e-mail e senha são obrigatórios."
      });
    }

    if (
      !String(nome).trim() ||
      !String(email).trim() ||
      String(senha).length < 6
    ) {
      return res.status(400).json({
        erro: "Informe nome e e-mail válidos e uma senha com pelo menos 6 caracteres."
      });
    }

    const tipoUsuario = tipo || "FUNCIONARIO";

    if (!["ADMIN", "FUNCIONARIO"].includes(tipoUsuario)) {
      return res.status(400).json({
        erro: "Tipo de usuário inválido."
      });
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    const existente = await prisma.usuario.findUnique({
      where: { email: emailNormalizado }
    });

    if (existente) {
      return res.status(409).json({
        erro: "Este e-mail já está cadastrado."
      });
    }

    const senhaHash = await bcrypt.hash(String(senha), 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome: String(nome).trim(),
        email: emailNormalizado,
        senha: senhaHash,
        tipo: tipoUsuario
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        criadoEm: true
      }
    });

    return res.status(201).json(usuario);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao cadastrar usuário."
    });
  }
}

async function atualizarUsuario(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        erro: "ID inválido."
      });
    }

    const existente = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!existente) {
      return res.status(404).json({
        erro: "Usuário não encontrado."
      });
    }

    const { nome, email, senha, tipo } = req.body;
    const dados = {};

    if (nome !== undefined) {
      if (!String(nome).trim()) {
        return res.status(400).json({
          erro: "Nome inválido."
        });
      }

      dados.nome = String(nome).trim();
    }

    if (email !== undefined) {
      const emailNormalizado = String(email).trim().toLowerCase();

      if (!emailNormalizado) {
        return res.status(400).json({
          erro: "E-mail inválido."
        });
      }

      const emailEmUso = await prisma.usuario.findUnique({
        where: { email: emailNormalizado }
      });

      if (emailEmUso && emailEmUso.id !== id) {
        return res.status(409).json({
          erro: "Este e-mail já está cadastrado."
        });
      }

      dados.email = emailNormalizado;
    }

    if (senha !== undefined) {
      if (String(senha).length < 6) {
        return res.status(400).json({
          erro: "A senha deve ter pelo menos 6 caracteres."
        });
      }

      dados.senha = await bcrypt.hash(String(senha), 10);
    }

    if (tipo !== undefined) {
      if (!["ADMIN", "FUNCIONARIO"].includes(tipo)) {
        return res.status(400).json({
          erro: "Tipo de usuário inválido."
        });
      }

      dados.tipo = tipo;
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: dados,
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        criadoEm: true
      }
    });

    return res.json(usuario);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao atualizar usuário."
    });
  }
}

async function excluirUsuario(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        erro: "ID inválido."
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      return res.status(404).json({
        erro: "Usuário não encontrado."
      });
    }

    await prisma.usuario.delete({
      where: { id }
    });

    return res.json({
      mensagem: "Usuário excluído com sucesso."
    });
  } catch (erro) {
    if (erro.code === "P2003" || erro.code === "P2014") {
      return res.status(409).json({
        erro: "Não é possível excluir este usuário porque ele possui vendas ou movimentações vinculadas."
      });
    }

    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao excluir usuário."
    });
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: "E-mail e senha são obrigatórios."
      });
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    const usuario = await prisma.usuario.findUnique({
      where: { email: emailNormalizado }
    });

    if (!usuario) {
      return res.status(401).json({
        erro: "E-mail ou senha inválidos."
      });
    }

    const senhaValida = await bcrypt.compare(
      String(senha),
      usuario.senha
    );

    if (!senhaValida) {
      return res.status(401).json({
        erro: "E-mail ou senha inválidos."
      });
    }

    return res.json({
      mensagem: "Login realizado com sucesso.",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      }
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao realizar login."
    });
  }
}

module.exports = {
  listarUsuarios,
  buscarUsuarioPorId,
  cadastrarUsuario,
  atualizarUsuario,
  excluirUsuario,
  login
};
