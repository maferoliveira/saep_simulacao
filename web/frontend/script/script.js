
const API_URL = "http://localhost:3000";

let discoEmEdicaoId = null;
let discosDisponiveis = [];

// =====================================
// FUNÇÕES GERAIS
// =====================================

function acessarApp() {
    window.location.href = "login.html";
}

function irParaLogin() {
    window.location.href = "login.html";
}

async function requisicaoAPI(rota, opcoes = {}) {
    const resposta = await fetch(`${API_URL}${rota}`, {
        ...opcoes,
        headers: {
            "Content-Type": "application/json",
            ...(opcoes.headers || {})
        }
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            dados.mensagem ||
            "Não foi possível realizar a operação."
        );
    }

    return dados;
}

function obterUsuarioLogado() {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (!usuarioSalvo) return null;

    try {
        return JSON.parse(usuarioSalvo);
    } catch {
        return null;
    }
}

function exigirLogin() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
        window.location.href = "login.html";
        return null;
    }

    return usuario;
}

function fazerLogout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(data) {
    if (!data) return "-";

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) return "-";

    return dataFormatada.toLocaleString("pt-BR");
}

// Cria uma célula sem interpretar os dados como HTML.
function criarCelula(valor) {
    const celula = document.createElement("td");
    celula.textContent = valor ?? "-";
    return celula;
}

// =====================================
// LOGIN
// =====================================

async function salvarDados(event) {
    event.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const senha = document.getElementById("senha")?.value;

    if (!email || !senha) {
        alert("Preencha o e-mail e a senha.");
        return;
    }

    try {
        const dados = await requisicaoAPI("/usuarios/login", {
            method: "POST",
            body: JSON.stringify({ email, senha })
        });

        if (!dados.usuario) {
            throw new Error("A API não retornou os dados do usuário.");
        }

        localStorage.setItem(
            "usuarioLogado",
            JSON.stringify(dados.usuario)
        );

        window.location.href = "home.html";
    } catch (erro) {
        console.error("Erro no login:", erro);
        alert(erro.message);
    }
}

// =====================================
// PAINEL PRINCIPAL
// =====================================

function carregarHome() {
    const usuario = exigirLogin();

    if (!usuario) return;

    const elementoNome = document.getElementById("nomeUsuario");

    if (elementoNome) {
        elementoNome.textContent = usuario.nome;
    }
}

// =====================================
// MODAL DE CADASTRO E EDIÇÃO
// =====================================

function abrirModal() {
    const modal = document.getElementById("modalDisco");

    if (!modal) return;

    if (typeof modal.showModal === "function") {
        if (!modal.open) modal.showModal();
    } else {
        modal.style.display = "flex";
    }
}

function fecharModal() {
    const modal = document.getElementById("modalDisco");

    if (!modal) return;

    if (typeof modal.close === "function" && modal.open) {
        modal.close();
    } else {
        modal.style.display = "none";
        limparFormularioDisco();
    }
}

function limparFormularioDisco() {
    discoEmEdicaoId = null;

    const formulario = document.getElementById("formCadastrarDisco");
    const campoQuantidade = document.getElementById("quantidadeEstoque");
    const botaoSalvar = document.getElementById("btnSalvarDisco");
    const tituloModal = document.getElementById("tituloModal");
    const subtituloModal = document.getElementById("subtituloModal");

    if (formulario) formulario.reset();

    if (campoQuantidade) {
        campoQuantidade.disabled = false;
        campoQuantidade.value = "0";
    }

    if (botaoSalvar) {
        botaoSalvar.textContent = "Cadastrar disco";
    }

    if (tituloModal) {
        tituloModal.textContent = "Cadastrar Disco";
    }

    if (subtituloModal) {
        subtituloModal.textContent =
            "Preencha os dados do disco para adicioná-lo ao acervo.";
    }
}

function prepararNovoDisco() {
    limparFormularioDisco();
    abrirModal();
}

// =====================================
// CADASTRAR OU ATUALIZAR DISCO
// =====================================

async function salvarDisco(event) {
    event.preventDefault();

    if (!exigirLogin()) return;

    const titulo = document.getElementById("nomeDisco").value.trim();
    const artista = document.getElementById("artista").value.trim();
    const genero = document.getElementById("genero").value.trim();
    const anoTexto = document.getElementById("anoLancamento").value;
    const precoTexto = document.getElementById("valorDisco").value;
    const quantidadeTexto = document.getElementById("quantidadeEstoque").value;
    const minimoTexto = document.getElementById("estoqueMinimo").value;
    const descricao = document.getElementById("descricao").value.trim();

    if (!titulo || !artista || !genero || precoTexto === "") {
        alert("Preencha o título, artista, gênero e preço do disco.");
        return;
    }

    const preco = Number(precoTexto);
    const estoqueMinimo = Number(minimoTexto);
    const ano = anoTexto === "" ? null : Number(anoTexto);
    const quantidade = Number(quantidadeTexto);

    if (!Number.isFinite(preco) || preco < 0) {
        alert("Informe um preço válido.");
        return;
    }

    if (!Number.isInteger(estoqueMinimo) || estoqueMinimo < 0) {
        alert("O estoque mínimo deve ser um número inteiro igual ou maior que zero.");
        return;
    }

    if (
        ano !== null &&
        (!Number.isInteger(ano) || ano < 1900 || ano > 2100)
    ) {
        alert("Informe um ano entre 1900 e 2100.");
        return;
    }

    if (
        discoEmEdicaoId === null &&
        (!Number.isInteger(quantidade) || quantidade < 0)
    ) {
        alert("A quantidade em estoque deve ser um número inteiro igual ou maior que zero.");
        return;
    }

    const dadosDisco = {
        titulo,
        artista,
        genero,
        anoLancamento: ano,
        preco,
        estoqueMinimo,
        descricao: descricao || null
    };

    // O estoque inicial é informado somente no cadastro.
    // Na edição, o estoque deve ser alterado por movimentações.
    if (discoEmEdicaoId === null) {
        dadosDisco.quantidadeEstoque = quantidade;
    }

    const editando = discoEmEdicaoId !== null;

    try {
        await requisicaoAPI(
            editando ? `/discos/${discoEmEdicaoId}` : "/discos",
            {
                method: editando ? "PUT" : "POST",
                body: JSON.stringify(dadosDisco)
            }
        );

        alert(
            editando
                ? "Disco atualizado com sucesso!"
                : "Disco cadastrado com sucesso!"
        );

        fecharModal();
        limparFormularioDisco();

        await listarDiscos();
    } catch (erro) {
        console.error("Erro ao salvar disco:", erro);
        alert(erro.message);
    }
}

// =====================================
// LISTAR E BUSCAR DISCOS
// =====================================

async function listarDiscos() {
    const tabela = document.getElementById("tabelaDiscos");

    try {
        discosDisponiveis = await requisicaoAPI("/discos");

        if (!Array.isArray(discosDisponiveis)) {
            throw new Error("A API não retornou uma lista válida de discos.");
        }

        atualizarSelectDiscos();

        if (!tabela) return;

        const busca = (
            document.getElementById("buscaDiscos")?.value || ""
        ).trim().toLowerCase();

        const filtrados = discosDisponiveis
            .filter(disco =>
                String(disco.titulo || "").toLowerCase().includes(busca) ||
                String(disco.artista || "").toLowerCase().includes(busca)
            )
            .sort((a, b) =>
                String(a.titulo || "").localeCompare(
                    String(b.titulo || ""),
                    "pt-BR"
                )
            );

        tabela.replaceChildren();

        if (filtrados.length === 0) {
            const linha = document.createElement("tr");
            const celula = criarCelula("Nenhum disco encontrado.");
            celula.colSpan = 7;
            linha.appendChild(celula);
            tabela.appendChild(linha);
            return;
        }

        filtrados.forEach(disco => {
            const linha = document.createElement("tr");

            linha.append(
                criarCelula(disco.titulo),
                criarCelula(disco.artista),
                criarCelula(disco.genero),
                criarCelula(disco.anoLancamento ?? "-"),
                criarCelula(formatarMoeda(disco.preco)),
                criarCelula(disco.quantidadeEstoque)
            );

            const celulaAcoes = document.createElement("td");

            const botaoEditar = document.createElement("button");
            botaoEditar.type = "button";
            botaoEditar.textContent = "Editar";
            botaoEditar.addEventListener("click", () => editarDisco(disco));

            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.textContent = "Excluir";
            botaoExcluir.addEventListener("click", () => excluirDisco(disco));

            celulaAcoes.append(botaoEditar, botaoExcluir);
            linha.appendChild(celulaAcoes);
            tabela.appendChild(linha);
        });
    } catch (erro) {
        console.error("Erro ao listar discos:", erro);

        if (tabela) {
            tabela.replaceChildren();
            const linha = document.createElement("tr");
            const celula = criarCelula("Não foi possível carregar os discos.");
            celula.colSpan = 7;
            linha.appendChild(celula);
            tabela.appendChild(linha);
        }
    }
}

// =====================================
// EDITAR DISCO
// =====================================

function editarDisco(disco) {
    discoEmEdicaoId = disco.id;

    document.getElementById("nomeDisco").value = disco.titulo ?? "";
    document.getElementById("artista").value = disco.artista ?? "";
    document.getElementById("genero").value = disco.genero ?? "";
    document.getElementById("anoLancamento").value =
        disco.anoLancamento ?? "";
    document.getElementById("valorDisco").value = Number(disco.preco);
    document.getElementById("quantidadeEstoque").value =
        disco.quantidadeEstoque ?? 0;
    document.getElementById("estoqueMinimo").value =
        disco.estoqueMinimo ?? 5;
    document.getElementById("descricao").value = disco.descricao ?? "";

    document.getElementById("quantidadeEstoque").disabled = true;
    document.getElementById("btnSalvarDisco").textContent = "Salvar alterações";
    document.getElementById("tituloModal").textContent = "Editar Disco";
    document.getElementById("subtituloModal").textContent =
        "Altere os dados do disco selecionado.";

    abrirModal();
}

// =====================================
// EXCLUIR DISCO
// =====================================

async function excluirDisco(disco) {
    const confirmar = confirm(
        `Deseja realmente excluir o disco "${disco.titulo}"?`
    );

    if (!confirmar) return;

    try {
        await requisicaoAPI(`/discos/${disco.id}`, {
            method: "DELETE"
        });

        alert("Disco excluído com sucesso!");
        await listarDiscos();
    } catch (erro) {
        console.error("Erro ao excluir disco:", erro);
        alert(
            erro.message ||
            "Não foi possível excluir o disco. Ele pode estar vinculado a vendas ou movimentações."
        );
    }
}

// =====================================
// CARREGAR DISCOS NO FORMULÁRIO DE VENDA
// =====================================

function atualizarSelectDiscos() {
    const select = document.getElementById("discoVenda");

    if (!select) return;

    const valorAnterior = select.value;

    select.replaceChildren();

    const opcaoInicial = document.createElement("option");
    opcaoInicial.value = "";
    opcaoInicial.textContent = "Selecione um disco";
    select.appendChild(opcaoInicial);

    const disponiveis = discosDisponiveis
        .filter(disco => Number(disco.quantidadeEstoque) > 0)
        .sort((a, b) =>
            String(a.titulo || "").localeCompare(
                String(b.titulo || ""),
                "pt-BR"
            )
        );

    disponiveis.forEach(disco => {
        const opcao = document.createElement("option");

        opcao.value = disco.id;
        opcao.textContent =
            `${disco.titulo} — ${disco.artista} | Estoque: ${disco.quantidadeEstoque}`;

        select.appendChild(opcao);
    });

    if (disponiveis.some(disco => String(disco.id) === valorAnterior)) {
        select.value = valorAnterior;
    }

    atualizarValorEstimado();
}

// =====================================
// CALCULAR VALOR ESTIMADO DA VENDA
// =====================================

function atualizarValorEstimado() {
    const select = document.getElementById("discoVenda");
    const campoQuantidade = document.getElementById("quantidadeVenda");
    const textoValor = document.getElementById("valorEstimado");

    if (!select || !campoQuantidade || !textoValor) return;

    const disco = discosDisponiveis.find(
        item => Number(item.id) === Number(select.value)
    );

    const quantidade = Number(campoQuantidade.value);
    const total = disco && quantidade > 0
        ? Number(disco.preco) * quantidade
        : 0;

    textoValor.textContent = `Valor estimado: ${formatarMoeda(total)}`;
}

// =====================================
// REGISTRAR VENDA
// =====================================

async function salvarVenda(event) {
    event.preventDefault();

    const usuario = exigirLogin();

    if (!usuario) return;

    const select = document.getElementById("discoVenda");
    const campoQuantidade = document.getElementById("quantidadeVenda");
    const botao = document.getElementById("btnRegistrarVenda");

    const discoId = Number(select.value);
    const quantidade = Number(campoQuantidade.value);

    const disco = discosDisponiveis.find(
        item => Number(item.id) === discoId
    );

    if (!disco) {
        alert("Selecione um disco disponível.");
        return;
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        alert("Informe uma quantidade inteira maior que zero.");
        return;
    }

    if (quantidade > Number(disco.quantidadeEstoque)) {
        alert(
            `Estoque insuficiente. Há apenas ${disco.quantidadeEstoque} unidade(s) disponível(is).`
        );
        return;
    }

    if (botao) {
        botao.disabled = true;
        botao.textContent = "Registrando...";
    }

    try {
        const venda = await requisicaoAPI("/vendas", {
            method: "POST",
            body: JSON.stringify({
                usuarioId: usuario.id,
                itens: [
                    {
                        discoId,
                        quantidade
                    }
                ]
            })
        });

        alert(
            `Venda nº ${venda.id} registrada com sucesso!\nValor total: ${formatarMoeda(venda.valorTotal)}`
        );

        document.getElementById("formVenda").reset();

        await listarDiscos();
        await listarVendas();
    } catch (erro) {
        console.error("Erro ao registrar venda:", erro);
        alert(erro.message);
    } finally {
        if (botao) {
            botao.disabled = false;
            botao.textContent = "Registrar Venda";
        }
    }
}

// =====================================
// RESUMO DE VENDAS RECENTES
// =====================================

async function listarVendas() {
    const tabela = document.getElementById("tabelaVendas");

    if (!tabela) return;

    try {
        const vendas = await requisicaoAPI("/vendas");

        if (!Array.isArray(vendas)) {
            throw new Error("A API não retornou uma lista válida de vendas.");
        }

        const recentes = [...vendas]
            .sort((a, b) =>
                new Date(b.data || 0).getTime() -
                new Date(a.data || 0).getTime()
            )
            .slice(0, 5);

        tabela.replaceChildren();

        if (recentes.length === 0) {
            const linha = document.createElement("tr");
            const celula = criarCelula("Nenhuma venda registrada ainda.");
            celula.colSpan = 6;
            linha.appendChild(celula);
            tabela.appendChild(linha);
            return;
        }

        recentes.forEach(venda => {
            const linha = document.createElement("tr");

            const itensTexto = (venda.itens || [])
                .map(item => {
                    const titulo = item.disco?.titulo || "Disco";
                    return `${titulo} (${item.quantidade})`;
                })
                .join(", ");

            linha.append(
                criarCelula(venda.id),
                criarCelula(venda.usuario?.nome || "-"),
                criarCelula(formatarData(venda.data)),
                criarCelula(formatarMoeda(venda.valorTotal)),
                criarCelula(venda.status || "Concluída"),
                criarCelula(itensTexto || "-")
            );

            tabela.appendChild(linha);
        });
    } catch (erro) {
        console.error("Erro ao listar vendas:", erro);

        tabela.replaceChildren();
        const linha = document.createElement("tr");
        const celula = criarCelula("Não foi possível carregar as vendas.");
        celula.colSpan = 6;
        linha.appendChild(celula);
        tabela.appendChild(linha);
    }
}

// =====================================
// INICIALIZAÇÃO
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    const caminho = window.location.pathname.toLowerCase();

    if (caminho.endsWith("home.html")) {
        carregarHome();
    }

    const formularioLogin = document.getElementById("formLogin");

    if (formularioLogin) {
        formularioLogin.addEventListener("submit", salvarDados);
    }

    const botaoCadastrar = document.getElementById("btnCadastrar");

    if (botaoCadastrar) {
        botaoCadastrar.addEventListener("click", prepararNovoDisco);
    }

    const formularioDisco = document.getElementById("formCadastrarDisco");

    if (formularioDisco) {
        formularioDisco.addEventListener("submit", salvarDisco);
    }

    const campoBusca = document.getElementById("buscaDiscos");

    if (campoBusca) {
        campoBusca.addEventListener("input", () => {
            const busca = campoBusca.value.trim().toLowerCase();

            const tabela = document.getElementById("tabelaDiscos");
            if (!tabela) return;

            const filtrados = discosDisponiveis
                .filter(disco =>
                    String(disco.titulo || "").toLowerCase().includes(busca) ||
                    String(disco.artista || "").toLowerCase().includes(busca)
                )
                .sort((a, b) =>
                    String(a.titulo || "").localeCompare(
                        String(b.titulo || ""),
                        "pt-BR"
                    )
                );

            tabela.replaceChildren();

            if (filtrados.length === 0) {
                const linha = document.createElement("tr");
                const celula = criarCelula("Nenhum disco encontrado.");
                celula.colSpan = 7;
                linha.appendChild(celula);
                tabela.appendChild(linha);
                return;
            }

            filtrados.forEach(disco => {
                const linha = document.createElement("tr");

                linha.append(
                    criarCelula(disco.titulo),
                    criarCelula(disco.artista),
                    criarCelula(disco.genero),
                    criarCelula(disco.anoLancamento ?? "-"),
                    criarCelula(formatarMoeda(disco.preco)),
                    criarCelula(disco.quantidadeEstoque)
                );

                const celulaAcoes = document.createElement("td");

                const botaoEditar = document.createElement("button");
                botaoEditar.type = "button";
                botaoEditar.textContent = "Editar";
                botaoEditar.addEventListener("click", () => editarDisco(disco));

                const botaoExcluir = document.createElement("button");
                botaoExcluir.type = "button";
                botaoExcluir.textContent = "Excluir";
                botaoExcluir.addEventListener("click", () => excluirDisco(disco));

                celulaAcoes.append(botaoEditar, botaoExcluir);
                linha.appendChild(celulaAcoes);
                tabela.appendChild(linha);
            });
        });
    }

    const formularioVenda = document.getElementById("formVenda");

    if (formularioVenda) {
        formularioVenda.addEventListener("submit", salvarVenda);
    }

    document.getElementById("discoVenda")?.addEventListener(
        "change",
        atualizarValorEstimado
    );

    document.getElementById("quantidadeVenda")?.addEventListener(
        "input",
        atualizarValorEstimado
    );

    const modal = document.getElementById("modalDisco");

    if (modal) {
        modal.addEventListener("close", limparFormularioDisco);
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                fecharModal();
            }
        });
    }

    if (document.getElementById("tabelaDiscos")) {
        listarDiscos();
    }

    if (document.getElementById("tabelaVendas")) {
        listarVendas();
    }
});
