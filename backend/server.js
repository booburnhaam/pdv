const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = require('./supabase');
const autenticarUsuario = require('./middleware/auth');

const app = express();
const PORT = 3000;

app.use(express.json());

// Disponibiliza os arquivos do front-end
app.use(express.static(path.join(__dirname, '../frontend')));

// Cria um cliente Supabase que utiliza o token do usuário autenticado
function criarClienteAutenticado(req) {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY,
        {
            global: {
                headers: {
                    Authorization: req.headers.authorization
                }
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    );
}

// Valida os dados recebidos para cadastro e atualização
function validarProduto(produto, parcial = false) {
    const camposPermitidos = [
        'codigo_barras',
        'nome',
        'categoria',
        'unidade',
        'preco',
        'quantidade',
        'estoque_minimo',
        'ativo'
    ];

    const camposRecebidos = Object.keys(produto);

    if (camposRecebidos.length === 0) {
        return 'Informe pelo menos um campo do produto.';
    }

    const campoInvalido = camposRecebidos.find(
        campo => !camposPermitidos.includes(campo)
    );

    if (campoInvalido) {
        return `O campo "${campoInvalido}" não é permitido.`;
    }

    if (!parcial && !produto.nome?.trim()) {
        return 'O nome do produto é obrigatório.';
    }

    if (produto.nome !== undefined) {
        if (typeof produto.nome !== 'string' || !produto.nome.trim()) {
            return 'Informe um nome válido para o produto.';
        }

        produto.nome = produto.nome.trim();
    }

    for (const campo of ['codigo_barras', 'categoria', 'unidade']) {
        if (produto[campo] !== undefined && produto[campo] !== null) {
            if (typeof produto[campo] !== 'string') {
                return `O campo "${campo}" deve ser um texto.`;
            }

            produto[campo] = produto[campo].trim();

            if (produto[campo] === '') {
                produto[campo] = null;
            }
        }
    }

    for (const campo of ['preco', 'quantidade', 'estoque_minimo']) {
        if (produto[campo] !== undefined) {
            const valor = produto[campo];

            if (
                typeof valor !== 'number' ||
                !Number.isFinite(valor) ||
                valor < 0
            ) {
                return `O campo "${campo}" deve ser um número válido e não negativo.`;
            }
        }
    }

    if (
        produto.ativo !== undefined &&
        typeof produto.ativo !== 'boolean'
    ) {
        return 'O campo "ativo" deve ser verdadeiro ou falso.';
    }

    return null;
}

// Rota de teste do back-end
app.get('/api/status', (req, res) => {
    res.json({
        mensagem: 'Servidor do PDV funcionando!',
        status: 'online'
    });
});

// Rota de teste da conexão com o Supabase
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

// Retorna os dados do usuário autenticado
app.get('/api/usuario', autenticarUsuario, (req, res) => {
    res.json({
        status: 'sucesso',
        mensagem: 'Usuário autenticado com sucesso!',
        usuario: {
            id: req.usuario.id,
            email: req.usuario.email
        }
    });
});

// LISTAR PRODUTOS
app.get('/api/produtos', autenticarUsuario, async (req, res) => {
    try {
        const cliente = criarClienteAutenticado(req);

        const { data, error } = await cliente
            .from('produtos')
            .select('*')
            .eq('ativo', true)
            .order('nome', { ascending: true });

        if (error) {
            console.error('Erro ao listar produtos:', error.message);

            return res.status(500).json({
                erro: 'Não foi possível listar os produtos.'
            });
        }

        res.json({
            status: 'sucesso',
            produtos: data
        });
    } catch (erro) {
        console.error('Erro inesperado ao listar produtos:', erro.message);

        res.status(500).json({
            erro: 'Ocorreu um erro ao consultar os produtos.'
        });
    }
});

// CADASTRAR PRODUTO
app.post('/api/produtos', autenticarUsuario, async (req, res) => {
    try {
        const produto = { ...req.body };
        const erroValidacao = validarProduto(produto);

        if (erroValidacao) {
            return res.status(400).json({ erro: erroValidacao });
        }

        const cliente = criarClienteAutenticado(req);

        const { data, error } = await cliente
            .from('produtos')
            .insert(produto)
            .select()
            .single();

        if (error) {
            console.error('Erro ao cadastrar produto:', error.message);

            if (error.code === '23505') {
                return res.status(409).json({
                    erro: 'Já existe um produto com esse código de barras.'
                });
            }

            return res.status(500).json({
                erro: 'Não foi possível cadastrar o produto.'
            });
        }

        res.status(201).json({
            status: 'sucesso',
            mensagem: 'Produto cadastrado com sucesso!',
            produto: data
        });
    } catch (erro) {
        console.error('Erro inesperado ao cadastrar produto:', erro.message);

        res.status(500).json({
            erro: 'Ocorreu um erro ao cadastrar o produto.'
        });
    }
});

// ATUALIZAR PRODUTO
app.put('/api/produtos/:id', autenticarUsuario, async (req, res) => {
    try {
        const id = req.params.id;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                erro: 'ID do produto inválido.'
            });
        }

        const produto = { ...req.body };
        const erroValidacao = validarProduto(produto, true);

        if (erroValidacao) {
            return res.status(400).json({ erro: erroValidacao });
        }

        const cliente = criarClienteAutenticado(req);

        const { data, error } = await cliente
            .from('produtos')
            .update(produto)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            console.error('Erro ao atualizar produto:', error.message);

            if (error.code === '23505') {
                return res.status(409).json({
                    erro: 'Já existe um produto com esse código de barras.'
                });
            }

            return res.status(500).json({
                erro: 'Não foi possível atualizar o produto.'
            });
        }

        if (!data) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        res.json({
            status: 'sucesso',
            mensagem: 'Produto atualizado com sucesso!',
            produto: data
        });
    } catch (erro) {
        console.error('Erro inesperado ao atualizar produto:', erro.message);

        res.status(500).json({
            erro: 'Ocorreu um erro ao atualizar o produto.'
        });
    }
});

// DESATIVAR PRODUTO
// Mantém o registro no banco para preservar o histórico de vendas.
app.delete('/api/produtos/:id', autenticarUsuario, async (req, res) => {
    try {
        const id = req.params.id;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                erro: 'ID do produto inválido.'
            });
        }

        const cliente = criarClienteAutenticado(req);

        const { data, error } = await cliente
            .from('produtos')
            .update({ ativo: false })
            .eq('id', id)
            .eq('ativo', true)
            .select('id, nome, ativo')
            .maybeSingle();

        if (error) {
            console.error('Erro ao desativar produto:', error.message);

            return res.status(500).json({
                erro: 'Não foi possível desativar o produto.'
            });
        }

        if (!data) {
            return res.status(404).json({
                erro: 'Produto não encontrado ou já desativado.'
            });
        }

        res.json({
            status: 'sucesso',
            mensagem: 'Produto desativado com sucesso!',
            produto: data
        });
    } catch (erro) {
        console.error('Erro inesperado ao desativar produto:', erro.message);

        res.status(500).json({
            erro: 'Ocorreu um erro ao desativar o produto.'
        });
    }
});

// Inicia o servidor

const servidor = app.listen(PORT, () => {
    console.log(`PDV disponível em http://localhost:${PORT}`);
    console.log('Servidor escutando:', servidor.listening);
});