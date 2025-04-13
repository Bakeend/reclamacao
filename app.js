// Variáveis globais
let acaoProtegida = null;
const CODIGO_SEGURANCA = "1234";

// Quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    DB.initDatabase().then(() => {
        setupAll();
        showSection('pesquisar');
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    }).catch(error => {
        console.error("Erro ao inicializar o sistema:", error);
        alert("Erro ao carregar o sistema. Por favor, recarregue a página.");
    });
});

// Configura todos os componentes
function setupAll() {
    setupNavigation();
    setupGerenciarTab();
    setupRatingSystem();
    setupEventListeners();
    
    // Carrega dados iniciais se for a primeira vez
    if (DB.getReclamacoes().length === 0) {
        loadSampleData();
    }
}

// Funções de Navegação
function setupNavigation() {
    document.querySelectorAll('nav button').forEach(button => {
        button.addEventListener('click', function() {
            // Remove classe active de todos os botões e seções
            document.querySelectorAll('nav button, .content-section').forEach(el => {
                el.classList.remove('active');
            });
            
            // Adiciona active no botão clicado
            this.classList.add('active');
            
            // Mostra a seção correspondente
            const target = this.id.replace('btn', '').toLowerCase();
            showSection(target);
        });
    });
}

function showSection(sectionId) {
    document.getElementById(sectionId).classList.add('active');
    
    // Atualiza os dados da seção se necessário
    switch(sectionId) {
        case 'pesquisar':
            pesquisarRuas();
            break;
        case 'relatorios':
            atualizarRelatorios();
            break;
    }
}

// Funções da Aba Gerenciar
function setupGerenciarTab() {
    // Tabs de gerenciamento
    document.querySelectorAll('#gerenciar .tabs button').forEach(button => {
        button.addEventListener('click', function() {
            // Remove tab-active de todos os botões
            document.querySelectorAll('#gerenciar .tabs button').forEach(btn => {
                btn.classList.remove('tab-active');
            });
            
            // Adiciona tab-active no botão clicado
            this.classList.add('tab-active');
            
            // Esconde todos os formulários
            document.querySelectorAll('#gerenciar .form-container').forEach(form => {
                form.classList.add('hidden');
            });
            
            // Mostra o formulário correspondente
            const formId = this.id.replace('btn', 'form');
            document.getElementById(formId).classList.remove('hidden');
        });
    });
}

// Configura eventos
function setupEventListeners() {
    // Modal de segurança
    document.getElementById("btnConfirmarCodigo").addEventListener("click", confirmarCodigo);
    document.getElementById("btnCancelarCodigo").addEventListener("click", fecharModal);
    
    // Pesquisa
    document.getElementById('btnBuscar').addEventListener('click', pesquisarRuas);
    document.getElementById('inputPesquisa').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') pesquisarRuas();
    });
    
    // Exportação
    document.getElementById('btnExportarCSV').addEventListener('click', exportarParaCSV);
    document.getElementById('btnExportarJSON').addEventListener('click', exportarParaJSON);
    
    // Formulários
    document.getElementById('formAdicionarSubmit').addEventListener('submit', function(e) {
        e.preventDefault();
        adicionarRua();
    });
    
    document.getElementById('formEditarSubmit').addEventListener('submit', function(e) {
        e.preventDefault();
        editarRua();
    });
    
    // Botões de gerenciamento
    document.getElementById('btnCarregarEdicao').addEventListener('click', carregarParaEdicao);
    document.getElementById('btnCarregarRemocao').addEventListener('click', carregarParaRemocao);
    document.getElementById('btnConfirmarRemocao').addEventListener('click', confirmarRemocao);
    
    // Expor função global para o HTML
    window.carregarParaEdicao = carregarParaEdicao;
}

// Funções de CRUD
function adicionarRua() {
    solicitarCodigo(() => {
        const novaReclamacao = {
            rua: document.getElementById('rua').value,
            numero: parseInt(document.getElementById('numero').value),
            bairro: document.getElementById('bairro').value,
            quantidadeReclamacoes: parseInt(document.getElementById('qtdReclamacoes').value),
            avaliacao: parseInt(document.getElementById('avaliacao').value)
        };

        DB.adicionarReclamacaoDB(novaReclamacao);
        document.getElementById('formAdicionarSubmit').reset();
        resetStars('rating');
        alert('Reclamação adicionada com sucesso!');
    });
}

function editarRua() {
    solicitarCodigo(() => {
        const id = parseInt(document.getElementById('editarId').value);
        const reclamacaoAtualizada = {
            rua: document.getElementById('editarRua').value,
            numero: parseInt(document.getElementById('editarNumero').value),
            bairro: document.getElementById('editarBairro').value,
            quantidadeReclamacoes: parseInt(document.getElementById('editarQtd').value),
            avaliacao: parseInt(document.getElementById('editarAvaliacao').value)
        };

        if (DB.atualizarReclamacaoDB(id, reclamacaoAtualizada)) {
            alert('Reclamação atualizada com sucesso!');
        } else {
            alert('Erro ao atualizar reclamação!');
        }
    });
}

function removerRua(id) {
    solicitarCodigo(() => {
        DB.removerReclamacaoDB(id);
        document.getElementById('removerId').value = '';
        document.getElementById('infoRemocao').classList.add('hidden');
        alert('Reclamação removida com sucesso!');
    });
}

// Funções de Interface
function pesquisarRuas() {
    const termo = document.getElementById('inputPesquisa').value.toLowerCase();
    const resultadosContainer = document.getElementById('resultadosPesquisa');
    const reclamacoes = DB.getReclamacoes();
    
    const resultados = termo ? 
        reclamacoes.filter(r => r.rua.toLowerCase().includes(termo)) : 
        reclamacoes;
    
    resultadosContainer.innerHTML = '';
    
    if (resultados.length === 0) {
        resultadosContainer.innerHTML = '<p class="no-results">Nenhuma reclamação encontrada.</p>';
        return;
    }
    
    resultados.forEach(item => {
        const elemento = document.createElement('div');
        elemento.className = 'result-item';
        elemento.innerHTML = `
            <div class="info">
                <h3>${item.rua}, ${item.numero}</h3>
                <p>Bairro: ${item.bairro}</p>
                <p>Reclamações: ${item.quantidadeReclamacoes}</p>
                <div class="rating">
                    ${Array(5).fill().map((_, i) => 
                        `<i class="fas fa-star${i < item.avaliacao ? ' active' : ''}"></i>`
                    ).join('')}
                </div>
            </div>
            <div class="actions">
                <button class="btn-primary" onclick="carregarParaEdicao(${item.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;
        resultadosContainer.appendChild(elemento);
    });
}

function carregarParaEdicao(id) {
    document.getElementById('btnGerenciar').click();
    document.getElementById('btnEditarRua').click();
    document.getElementById('editarId').value = id;
    document.getElementById('btnCarregarEdicao').click();
}

function carregarParaRemocao() {
    const id = parseInt(document.getElementById('removerId').value);
    const reclamacao = DB.getReclamacaoById(id);
    
    if (reclamacao) {
        document.getElementById('ruaRemover').textContent = reclamacao.rua;
        document.getElementById('numeroRemover').textContent = reclamacao.numero;
        document.getElementById('bairroRemover').textContent = reclamacao.bairro;
        document.getElementById('infoRemocao').classList.remove('hidden');
    } else {
        alert('Reclamação não encontrada!');
    }
}

function confirmarRemocao() {
    const id = parseInt(document.getElementById('removerId').value);
    removerRua(id);
}

// Funções de Relatórios
function atualizarRelatorios() {
    const container = document.getElementById('conteudoRelatorios');
    const reclamacoes = DB.getReclamacoes();
    
    if (reclamacoes.length === 0) {
        container.innerHTML = '<p>Não há dados para exibir.</p>';
        return;
    }
    
    // Cálculo de estatísticas
    const totalReclamacoes = reclamacoes.reduce((sum, r) => sum + r.quantidadeReclamacoes, 0);
    const mediaReclamacoes = totalReclamacoes / reclamacoes.length;
    const rankingAvaliacao = gerarRankingAvaliacao(reclamacoes);
    
    container.innerHTML = `
        <div class="report-section">
            <h3><i class="fas fa-chart-pie"></i> Estatísticas Gerais</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total de Registros</h4>
                    <p>${reclamacoes.length}</p>
                </div>
                <div class="stat-card">
                    <h4>Total de Reclamações</h4>
                    <p>${totalReclamacoes}</p>
                </div>
                <div class="stat-card">
                    <h4>Média por Rua</h4>
                    <p>${mediaReclamacoes.toFixed(1)}</p>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h3><i class="fas fa-star"></i> Distribuição por Avaliação</h3>
            <div class="rating-distribution">
                ${rankingAvaliacao.map(item => `
                    <div class="rating-item">
                        <div class="stars">${item.stars}</div>
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress" style="width: ${item.percent}%"></div>
                            </div>
                            <span class="count">${item.count} (${item.percent}%)</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="report-section">
            <h3><i class="fas fa-list-ol"></i> Ranking por Bairro</h3>
            <div class="ranking-container">
                ${gerarRankingBairros(reclamacoes)}
            </div>
        </div>
    `;
}

function gerarRankingAvaliacao(reclamacoes) {
    const porAvaliacao = reclamacoes.reduce((acc, r) => {
        acc[r.avaliacao] = (acc[r.avaliacao] || 0) + 1;
        return acc;
    }, {});

    const total = reclamacoes.length;
    return [5, 4, 3, 2, 1].map(avaliacao => {
        const count = porAvaliacao[avaliacao] || 0;
        const percent = (count / total * 100).toFixed(1);
        
        return {
            avaliacao,
            count,
            percent,
            stars: '★'.repeat(avaliacao) + '☆'.repeat(5 - avaliacao)
        };
    });
}

function gerarRankingBairros(reclamacoes) {
    const porBairro = reclamacoes.reduce((acc, r) => {
        acc[r.bairro] = (acc[r.bairro] || 0) + r.quantidadeReclamacoes;
        return acc;
    }, {});
    
    return Object.entries(porBairro)
        .sort((a, b) => b[1] - a[1])
        .map(([bairro, total], i) => `
            <div class="ranking-item">
                <span class="rank">${i + 1}º</span>
                <span class="bairro">${bairro}</span>
                <span class="total">${total} reclamações</span>
                <div class="progress-bar">
                    <div class="progress" style="width: ${(total / Math.max(...Object.values(porBairro)) * 100)}%"></div>
                </div>
            </div>
        `).join('');
}

// Funções de Exportação
function exportarParaCSV() {
    const reclamacoes = DB.getReclamacoes();
    const csvContent = [
        'ID,Rua,Número,Bairro,Reclamações,Avaliação',
        ...reclamacoes.map(r => 
            `${r.id},"${r.rua}",${r.numero},"${r.bairro}",${r.quantidadeReclamacoes},${r.avaliacao}`
        )
    ].join('\n');
    
    downloadFile('reclamacoes.csv', csvContent, 'text/csv');
    document.getElementById('exportResult').innerHTML = '<p>Arquivo CSV gerado com sucesso!</p>';
}

function exportarParaJSON() {
    const reclamacoes = DB.getReclamacoes();
    const jsonContent = JSON.stringify(reclamacoes, null, 2);
    
    downloadFile('reclamacoes.json', jsonContent, 'application/json');
    document.getElementById('exportResult').innerHTML = '<p>Arquivo JSON gerado com sucesso!</p>';
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Funções Auxiliares
function setupRatingSystem() {
    document.querySelectorAll('.rating i').forEach(star => {
        star.addEventListener('click', function() {
            const container = this.parentElement;
            const value = parseInt(this.dataset.value);
            const hiddenInput = container.nextElementSibling;
            
            // Atualiza visual das estrelas
            container.querySelectorAll('i').forEach((s, i) => {
                s.classList.toggle('active', i < value);
            });
            
            // Atualiza valor do input
            hiddenInput.value = value;
        });
    });
}

function resetStars(containerId) {
    const container = document.getElementById(containerId);
    container.querySelectorAll('i').forEach((star, i) => {
        star.classList.toggle('active', i === 0);
    });
    container.nextElementSibling.value = 1;
}

function updateStars(containerId, rating) {
    const container = document.getElementById(containerId);
    container.querySelectorAll('i').forEach((star, i) => {
        star.classList.toggle('active', i < rating);
    });
    container.nextElementSibling.value = rating;
}

function solicitarCodigo(acao) {
    acaoProtegida = acao;
    const modal = document.getElementById("modalSeguranca");
    const input = document.getElementById("inputCodigoSeguranca");
    modal.style.display = "flex";
    input.value = "";
    input.focus();
}

function fecharModal() {
    document.getElementById("modalSeguranca").style.display = "none";
    acaoProtegida = null;
}

function confirmarCodigo() {
    const input = document.getElementById("inputCodigoSeguranca");
    if (input.value === CODIGO_SEGURANCA) {
        if (acaoProtegida) acaoProtegida();
        fecharModal();
    } else {
        alert("Código incorreto!");
    }
}

function loadSampleData() {
    const sampleData = [
        {id: 1, rua: "Rua das Flores", numero: 100, bairro: "Centro", quantidadeReclamacoes: 5, avaliacao: 3},
        {id: 2, rua: "Avenida Brasil", numero: 200, bairro: "Jardim", quantidadeReclamacoes: 8, avaliacao: 2},
        {id: 3, rua: "Rua dos Pássaros", numero: 50, bairro: "Centro", quantidadeReclamacoes: 3, avaliacao: 4}
    ];
    sampleData.forEach(item => DB.adicionarReclamacaoDB(item));
}