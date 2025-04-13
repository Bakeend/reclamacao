const DB_KEY = 'sistema_reclamacoes_urbanas';

const DB = {
    // Inicializa o banco de dados
    initDatabase() {
        if (!localStorage.getItem(DB_KEY)) {
            const dadosIniciais = [
                { id: 1, rua: "Rua das Flores", numero: 100, bairro: "Centro", quantidadeReclamacoes: 5, avaliacao: 3 },
                { id: 2, rua: "Avenida Brasil", numero: 200, bairro: "Jardim", quantidadeReclamacoes: 8, avaliacao: 2 },
                { id: 2, rua: "Avenida Roma", numero: 200, bairro: "Jardim", quantidadeReclamacoes: 8, avaliacao: 2 }
            ];
            localStorage.setItem(DB_KEY, JSON.stringify(dadosIniciais));
        }
        return Promise.resolve();
    },

    // Obtém todas as reclamações
    getReclamacoes() {
        return JSON.parse(localStorage.getItem(DB_KEY)) || [];
    },

    // Salva todas as reclamações
    saveReclamacoes(dados) {
        localStorage.setItem(DB_KEY, JSON.stringify(dados));
    },

    // Obtém uma reclamação por ID
    getReclamacaoById(id) {
        return this.getReclamacoes().find(item => item.id === id);
    },

    // Adiciona nova reclamação
    adicionarReclamacaoDB(dados) {
        const reclamacoes = this.getReclamacoes();
        const novoId = reclamacoes.length > 0 ? Math.max(...reclamacoes.map(r => r.id)) + 1 : 1;
        
        const novaReclamacao = {
            id: novoId,
            rua: dados.rua.trim(),
            numero: parseInt(dados.numero) || 0,
            bairro: dados.bairro.trim(),
            quantidadeReclamacoes: parseInt(dados.quantidadeReclamacoes) || 0,
            avaliacao: Math.min(Math.max(parseInt(dados.avaliacao), 1), 5)
        };

        reclamacoes.push(novaReclamacao);
        this.saveReclamacoes(reclamacoes);
        return novoId;
    },

    // Atualiza reclamação existente
    atualizarReclamacaoDB(id, dados) {
        const reclamacoes = this.getReclamacoes();
        const index = reclamacoes.findIndex(item => item.id === id);
        
        if (index !== -1) {
            reclamacoes[index] = { 
                ...reclamacoes[index], 
                ...dados,
                id // Mantém o ID original
            };
            this.saveReclamacoes(reclamacoes);
            return true;
        }
        return false;
    },

    // Remove reclamação
    removerReclamacaoDB(id) {
        const reclamacoes = this.getReclamacoes().filter(item => item.id !== id);
        this.saveReclamacoes(reclamacoes);
    }
};

// Torna acessível globalmente
window.DB = DB;