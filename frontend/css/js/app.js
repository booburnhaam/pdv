
const navItems = document.querySelectorAll('.nav-item');
const quickCards = document.querySelectorAll('.quick-card');
const views = document.querySelectorAll('.view');

const pageTitle = document.getElementById('pageTitle');
const breadcrumb = document.getElementById('breadcrumb');
const currentDate = document.getElementById('currentDate');

const nomesTelas = {
    dashboard: 'Dashboard',
    caixa: 'Caixa / Vendas',
    produtos: 'Produtos',
    estoque: 'Estoque',
    historico: 'Histórico de vendas',
    relatorios: 'Relatórios'
};

function abrirTela(nome) {
    const tela = document.getElementById(nome);

    if (!tela) return;

    views.forEach(view => {
        view.classList.toggle('hidden', view.id !== nome);
    });

    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === nome);
    });

    pageTitle.textContent = nomesTelas[nome];
    breadcrumb.textContent = nomesTelas[nome];
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        abrirTela(item.dataset.view);
    });
});

quickCards.forEach(card => {
    card.addEventListener('click', () => {
        abrirTela(card.dataset.view);
    });
});

currentDate.textContent = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
});