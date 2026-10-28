
const express = require('express');
const path = require('path');

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

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`PDV disponível em http://localhost:${PORT}`);
});
