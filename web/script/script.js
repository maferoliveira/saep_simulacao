function acessarApp() {
    alert("Bem-vindo à Vinil Store! A preparar a sua experiência musical...");
    
}

function irParaLogin() {
    window.location.href = "login.html";
}

// Interface de Autenticação
function salvarDados(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    if (!email || !senha) {
        alert("Por favor, preencha o e-mail e a senha corretamente.");
        return;
    }

    console.log("Credenciais validadas para:", email);

    alert(`Bem-vindo(a) de volta, ${nome}! Autenticação efetuada com sucesso.`);

    
    window.location.href = "home.html";
}
function salvarDados(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    if (!email || !senha || !nome) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    localStorage.setItem('usuarioLogado', nome);

    alert(`Bem-vindo(a), ${nome}! Autenticação efetuada com sucesso.`);

    window.location.href = "home.html";
}

function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    
    window.location.href = "login.html";
}
function abrirModal() {
    const modal = document.getElementById('modalDisco');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharModal() {
    const modal = document.getElementById('modalDisco');
    if (modal) {
        modal.style.display = 'none';
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('modalDisco');
    if (event.target === modal) {
        fecharModal();
    }
}

function salvarDisco(event) {
    event.preventDefault();

    const nomeDisco = document.getElementById('nomeDisco').value;
    const nomeComprador = document.getElementById('nomeComprador').value;
    const dataCompra = document.getElementById('dataCompra').value;
    const valorDisco = parseFloat(document.getElementById('valorDisco').value).toFixed(2);

    const partesData = dataCompra.split('-');
    const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

    const tabela = document.getElementById('tabelaVendas');

    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td>${nomeDisco}</td>
        <td>${nomeComprador}</td>
        <td>${dataFormatada}</td>
        <td>R$ ${valorDisco.replace('.', ',')}</td>
    `;

    if (tabela) {
        tabela.insertBefore(novaLinha, tabela.firstChild);
    }

    alert('Disco cadastrado e venda registrada com sucesso!');

    document.getElementById('formCadastrarDisco').reset();
    fecharModal();
}

const modal = document.getElementById("modalDisco")
const btnCadastrar=document.getElementById("btnCadastrar")

btnCadastrar.addEventListener("click",()=>{
    modal.showModal()
})
