const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of lines) {
    if (line.startsWith('PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
    if (line.startsWith('PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    let { data, error } = await supabase.rpc('get_tables');
    // If rpc fails, we can't easily list tables from JS without a proper query,
    // let's just query pg_catalog if possible, but REST API doesn't allow it.
    // However, maybe there is a 'documentos_embeddings' table?
    let { error: err3 } = await supabase.schema('nutricionista').from('documentos_embeddings').select('*').limit(1);
    console.log('documentos_embeddings:', err3 ? err3.message : 'EXISTS');
}
check();
