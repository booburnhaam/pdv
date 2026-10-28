
const btnStatus = document.getElementById('btnStatus');
const resultado = document.getElementById('resultado');

btnStatus.addEventListener('click', async () => {
    resultado.textContent = 'Verificando conexão...';

    try {
        const resposta = await fetch('/api/status');
        const dados = await resposta.json();

        resultado.textContent = dados.mensagem;
    } catch (erro) {
        resultado.textContent = 'Não foi possível conectar ao servidor.';
        console.error(erro);
    }
});
