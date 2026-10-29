
const SUPABASE_URL = 'https://utgjpixawynbfaxvufea.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_JC7ipx7CnlyOrSD6YYd7Uw_MZVNqK4k';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// Elementos do login
const telaLogin = document.getElementById('tela-login');
const formLogin = document.getElementById('form-login');
const campoEmail = document.getElementById('login-email');
const campoSenha = document.getElementById('login-senha');
const botaoLogin = document.getElementById('btn-login');
const mensagemLogin = document.getElementById('login-mensagem');

// Área principal do PDV
const areaPDV = document.getElementById('area-pdv');
const botaoLogout = document.getElementById('btn-logout');

// Elementos da navegação
const navItems = document.querySelectorAll('.nav-item');
const quickCards = document.querySelectorAll('.quick-card');
const views = document.querySelectorAll('.view');

const pageTitle = document.getElementById('pageTitle');
const breadcrumb = document.getElementById('breadcrumb');
const currentDate = document.getElementById('currentDate');
const listaProdutos = document.getElementById('lista-produtos');
const mensagemProdutos = document.getElementById('mensagem-produtos');

const botaoNovoProduto = document.getElementById('btn-novo-produto');
const campoUnidade = document.getElementById('produto-unidade');
const campoQuantidade = document.getElementById('produto-quantidade');
const campoEstoqueMinimo = document.getElementById('produto-minimo');
const campoPreco = document.getElementById('produto-preco');
const campoNome = document.getElementById('produto-nome');

// Unidades que permitem quantidades fracionadas
const unidadesFracionaveis = [
    'kg',
    'g',
    'litro',
    'ml'
];

function atualizarRegraQuantidade() {
    if (!campoUnidade || !campoQuantidade || !campoEstoqueMinimo) {
        return;
    }

    const aceitaDecimal = unidadesFracionaveis.includes(
        campoUnidade.value
    );

    const passo = aceitaDecimal ? '0.001' : '1';

    campoQuantidade.step = passo;
    campoEstoqueMinimo.step = passo;

    campoQuantidade.min = '0';
    campoEstoqueMinimo.min = '0';

    campoQuantidade.inputMode = aceitaDecimal ? 'decimal' : 'numeric';
    campoEstoqueMinimo.inputMode = aceitaDecimal ? 'decimal' : 'numeric';

    campoQuantidade.placeholder = aceitaDecimal ? 'Ex.: 2,500' : 'Ex.: 2';
    campoEstoqueMinimo.placeholder = aceitaDecimal ? 'Ex.: 0,500' : 'Ex.: 1';

    // Corrige valores incompatíveis com a nova unidade
    if (!aceitaDecimal) {
        if (campoQuantidade.value !== '') {
            campoQuantidade.value = Math.max(
                0,
                Math.floor(Number(campoQuantidade.value) || 0)
            );
        }

        if (campoEstoqueMinimo.value !== '') {
            campoEstoqueMinimo.value = Math.max(
                0,
                Math.floor(Number(campoEstoqueMinimo.value) || 0)
            );
        }
    }
}

if (campoUnidade) {
    campoUnidade.addEventListener('change', atualizarRegraQuantidade);
    atualizarRegraQuantidade();
}

const formularioProduto = document.getElementById('formulario-produto');
const formProduto = document.getElementById('form-produto');
const botaoCancelarProduto = document.getElementById('btn-cancelar-produto');

const nomesTelas = {
    dashboard: 'Dashboard',
    caixa: 'Caixa / Vendas',
    produtos: 'Produtos',
    estoque: 'Estoque',
    historico: 'Histórico de vendas',
    relatorios: 'Relatórios'
};

// Alterna entre as telas do sistema
function abrirTela(nome) {
    const tela = document.getElementById(nome);

    if (!tela) return;

    views.forEach(view => {
        view.classList.toggle('hidden', view.id !== nome);
    });

    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === nome);
    });

    if (pageTitle) {
        pageTitle.textContent = nomesTelas[nome] || nome;
    }

    if (breadcrumb) {
        breadcrumb.textContent = nomesTelas[nome] || nome;
    }
    if (nome === 'produtos') {
        carregarProdutos();
    }

    if (botaoNovoProduto && formularioProduto) {
        botaoNovoProduto.addEventListener('click', () => {
            formularioProduto.classList.remove('hidden');
        });
    }

    if (botaoCancelarProduto && formularioProduto) {
        botaoCancelarProduto.addEventListener('click', () => {
            formularioProduto.classList.add('hidden');
            formProduto?.reset();
        });
    }

}

if (formProduto) {
    formProduto.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const nome = campoNome.value.trim();
        const unidade = campoUnidade.value;
        const precoTexto = campoPreco.value.trim().replace(',', '.');
        const quantidadeTexto = campoQuantidade.value.trim().replace(',', '.');
        const minimoTexto = campoEstoqueMinimo.value.trim().replace(',', '.');

        const aceitaDecimal = unidadesFracionaveis.includes(unidade);

        const preco = Number(precoTexto);
        const quantidade = Number(quantidadeTexto);
        const estoqueMinimo = Number(minimoTexto);

        // Limpa a mensagem anterior
        mostrarMensagemProduto('');

        // Valida o nome
        if (!nome) {
            mostrarMensagemProduto('Informe o nome do produto.');
            campoNome.focus();
            return;
        }

        // Valida o preço
        if (
            precoTexto === '' ||
            !Number.isFinite(preco) ||
            preco < 0 ||
            !/^\d+(\.\d{1,2})?$/.test(precoTexto)
        ) {
            mostrarMensagemProduto(
                'Informe um preço válido, com até duas casas decimais.'
            );
            campoPreco.focus();
            return;
        }

        // Define o padrão de quantidade conforme a unidade
        const padraoQuantidade = aceitaDecimal
            ? /^\d+(\.\d{1,3})?$/
            : /^\d+$/;

        // Valida a quantidade em estoque
        if (
            quantidadeTexto === '' ||
            !Number.isFinite(quantidade) ||
            quantidade < 0 ||
            !padraoQuantidade.test(quantidadeTexto)
        ) {
            mostrarMensagemProduto(
                aceitaDecimal
                    ? 'Informe uma quantidade válida, com até três casas decimais.'
                    : 'Informe uma quantidade inteira, sem casas decimais.'
            );
            campoQuantidade.focus();
            return;
        }

        // Valida o estoque mínimo
        if (
            minimoTexto === '' ||
            !Number.isFinite(estoqueMinimo) ||
            estoqueMinimo < 0 ||
            !padraoQuantidade.test(minimoTexto)
        ) {
            mostrarMensagemProduto(
                aceitaDecimal
                    ? 'Informe um estoque mínimo válido, com até três casas decimais.'
                    : 'Informe um estoque mínimo inteiro.'
            );
            campoEstoqueMinimo.focus();
            return;
        }

        // Confirma que os campos passaram pela validação
        // Envia os dados para o back-end
        const botaoSalvar = document.getElementById('btn-salvar-produto');

        try {
            mostrarMensagemProduto('Salvando produto...', 'sucesso');

            if (botaoSalvar) {
                botaoSalvar.disabled = true;
                botaoSalvar.textContent = 'Salvando...';
            }

            // Recupera o token da sessão autenticada
            const { data: sessaoData, error: sessaoErro } =
                await supabaseClient.auth.getSession();

            if (sessaoErro) {
                throw sessaoErro;
            }

            const token = sessaoData.session?.access_token;

            if (!token) {
                throw new Error('Sua sessão expirou. Entre novamente.');
            }

            // Monta os dados do produto
            const produto = {
                nome,
                codigo_barras:
                    document.getElementById('produto-codigo').value.trim() || null,
                categoria:
                    document.getElementById('produto-categoria').value.trim() || null,
                unidade,
                preco,
                quantidade,
                estoque_minimo: estoqueMinimo
            };

            const resposta = await fetch('/api/produtos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(produto)
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro || 'Não foi possível cadastrar o produto.'
                );
            }

            mostrarMensagemProduto(
                resultado.mensagem || 'Produto cadastrado com sucesso!',
                'sucesso'
            );

            // Limpa o formulário e atualiza a tabela
            formProduto.reset();
            atualizarRegraQuantidade();

            await carregarProdutos();

        } catch (erro) {
            console.error('Erro ao cadastrar produto:', erro);

            mostrarMensagemProduto(
                erro.message || 'Ocorreu um erro ao cadastrar o produto.'
            );
        } finally {
            if (botaoSalvar) {
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = 'Salvar produto';
            }
        }

    });
}

// Navegação pelo menu lateral
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const nomeTela = item.dataset.view;

        if (nomeTela) {
            abrirTela(nomeTela);
        }
    });
});

// Navegação pelos cartões de acesso rápido
quickCards.forEach(card => {
    card.addEventListener('click', () => {
        abrirTela(card.dataset.view);
    });
});

// Atualiza a data do dashboard
if (currentDate) {
    currentDate.textContent = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// Mostra a tela de login
function mostrarLogin() {
    if (telaLogin) {
        telaLogin.classList.remove('hidden');
    }

    if (areaPDV) {
        areaPDV.classList.add('hidden');
    }
}

// Mostra o sistema após autenticação
function mostrarPDV() {
    if (telaLogin) {
        telaLogin.classList.add('hidden');
    }

    if (areaPDV) {
        areaPDV.classList.remove('hidden');
    }
}

// Realiza o login com o Supabase Auth
if (formLogin) {
    formLogin.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const email = campoEmail.value.trim();
        const senha = campoSenha.value;

        mensagemLogin.textContent = '';
        botaoLogin.disabled = true;
        botaoLogin.textContent = 'Entrando...';

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password: senha
            });

            if (error) {
                console.error('Erro no login:', error.message);

                mensagemLogin.textContent =
                    'Não foi possível entrar. Confira seu e-mail e sua senha.';

                return;
            }

            if (data.session) {
                mensagemLogin.textContent = '';
                campoSenha.value = '';
                mostrarPDV();
                abrirTela('dashboard');
            }
        } catch (erro) {
            console.error('Erro inesperado no login:', erro);

            mensagemLogin.textContent =
                'Ocorreu um erro ao tentar entrar. Tente novamente.';
        } finally {
            botaoLogin.disabled = false;
            botaoLogin.textContent = 'Entrar';
        }
    });
}

// Encerra a sessão
if (botaoLogout) {
    botaoLogout.addEventListener('click', async () => {
        botaoLogout.disabled = true;

        try {
            const { error } = await supabaseClient.auth.signOut();

            if (error) {
                console.error('Erro ao sair:', error.message);
                alert('Não foi possível encerrar a sessão. Tente novamente.');
            }
        } catch (erro) {
            console.error('Erro inesperado ao sair:', erro);
            alert('Ocorreu um erro ao encerrar a sessão.');
        } finally {
            botaoLogout.disabled = false;
        }
    });
}

// Restaura a sessão ao abrir ou atualizar a página
async function verificarSessao() {
    mostrarLogin();

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error('Erro ao verificar a sessão:', error.message);
        return;
    }

    if (data.session) {
        mostrarPDV();
        abrirTela('dashboard');
    }
}

// Atualiza a interface quando o estado da autenticação muda
supabaseClient.auth.onAuthStateChange((evento, sessao) => {
    if (sessao) {
        mostrarPDV();
    } else {
        mostrarLogin();
    }
});

async function carregarProdutos() {
    if (!listaProdutos) return;

    listaProdutos.innerHTML = `
        <tr>
            <td colspan="7">Carregando produtos...</td>
        </tr>
    `;

    try {
        const { data: sessaoData, error: sessaoErro } =
            await supabaseClient.auth.getSession();

        if (sessaoErro) {
            throw sessaoErro;
        }

        const token = sessaoData.session?.access_token;

        if (!token) {
            throw new Error('Sua sessão expirou. Entre novamente.');
        }

        const resposta = await fetch('/api/produtos', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || resultado.mensagem ||
                'Não foi possível carregar os produtos.'
            );
        }

        const produtos = Array.isArray(resultado)
            ? resultado
            : resultado.produtos;

        if (!Array.isArray(produtos)) {
            throw new Error('O servidor retornou um formato inesperado.');
        }

        if (produtos.length === 0) {
            listaProdutos.innerHTML = `
                <tr>
                    <td colspan="7">Nenhum produto cadastrado.</td>
                </tr>
            `;
            return;
        }

        listaProdutos.innerHTML = produtos.map(produto => `
            <tr>
                <td>${escaparHTML(produto.nome)}</td>
                <td>${escaparHTML(produto.codigo_barras || '—')}</td>
                <td>${escaparHTML(produto.categoria || '—')}</td>
                <td>${escaparHTML(produto.unidade || 'unidade')}</td>
                <td>${Number(produto.preco).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                })}</td>
                <td>${Number(produto.quantidade).toLocaleString('pt-BR')}</td>
                <td>Em breve</td>
            </tr>
        `).join('');

    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro);

        listaProdutos.innerHTML = `
            <tr>
                <td colspan="7">Não foi possível carregar os produtos.</td>
            </tr>
        `;

        if (mensagemProdutos) {
            mensagemProdutos.textContent = erro.message;
        }
    }
}


function mostrarMensagemProduto(texto, tipo = 'erro') {
    if (!mensagemProdutos) return;

    mensagemProdutos.textContent = texto;
    mensagemProdutos.className = `mensagem-produtos ${tipo}`;
}


function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caractere]);
}

verificarSessao();