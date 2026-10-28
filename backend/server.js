const express = require('express');
const path = require('path');
const supabase = require('./supabase');

const app = express();
const PORT = 3000;

// Permite receber dados no formato JSON
app.use(express.json());

// Disponibiliza os arquivos do front-end
app.use(express.static(path.join(__dirname, '../frontend')));

// Rota de teste do back-end
app.get('/api/status', (req, res) => {
    res.json({
        mensagem: 'Servidor do PDV funcionando!',
        status: 'online'
    });
});


app.get('/api/teste-conexao', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('teste_conexao')
            .select('id, mensagem')
            .limit(1);

        if (error) {
            console.error('Erro do Supabase:', error.message);

            return res.status(500).json({
                status: 'erro',
                mensagem: 'Não foi possível consultar o banco de dados.'
            });
        }

        res.json({
            status: 'sucesso',
            mensagem: 'Conexão com o Supabase funcionando!',
            dados: data
        });
    } catch (erro) {
        console.error('Erro inesperado:', erro.message);

        res.status(500).json({
            status: 'erro',
            mensagem: 'Ocorreu um erro inesperado.'
        });
    }
});


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`PDV disponível em http://localhost:${PORT}`);
});
