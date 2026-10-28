require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no arquivo .env'
    );
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;