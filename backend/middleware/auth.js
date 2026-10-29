
const { createClient } = require('@supabase/supabase-js');

async function autenticarUsuario(req, res, next) {
    const cabecalho = req.headers.authorization;

    if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
        return res.status(401).json({
            erro: 'Token de autenticação não informado.'
        });
    }

    const token = cabecalho.substring(7);

    try {
        const supabaseAuth = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_PUBLISHABLE_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        );

        const { data, error } = await supabaseAuth.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({
                erro: 'Token inválido ou expirado.'
            });
        }

        req.usuario = data.user;
        next();
    } catch (erro) {
        console.error('Erro ao autenticar usuário:', erro.message);

        return res.status(500).json({
            erro: 'Não foi possível validar a autenticação.'
        });
    }
}

module.exports = autenticarUsuario;