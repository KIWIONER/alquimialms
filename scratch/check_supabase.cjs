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
    let { data, error } = await supabase.schema('nutricionista').from('documentos').select('*').limit(2);
    console.log('Documentos:', data);
    
    // Check vector table in public or nutricionista
    let { data: vecData1, error: vecError1 } = await supabase.from('documents').select('metadata').limit(2);
    if (!vecError1 && vecData1) console.log('public.documents table found! Sample metadata: ', vecData1);

    let { data: vecData2, error: vecError2 } = await supabase.from('embeddings').select('metadata').limit(2);
    if (!vecError2 && vecData2) console.log('public.embeddings table found! Sample metadata: ', vecData2);
}
check();
