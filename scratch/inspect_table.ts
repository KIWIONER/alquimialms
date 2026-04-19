import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log('Inspecting documents table...');
    
    // 1. Get a row that has SOME data (specifically anything in name-like or folder-like columns)
    const { data, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('*')
        .not('contenido', 'is', null)
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        // If everything is null, let's at least see one row total
        const { data: anyRow } = await supabase.schema('nutricionista').from('documentos').select('*').limit(1);
        console.log('No rows with content found. Any row sample:', JSON.stringify(anyRow, null, 2));
    } else {
        console.log('Found row with content:', JSON.stringify(data[0], null, 2));
    }

    // 2. See column names
    // We can't easily get schema via JS client without RPC, but we can see the keys in the returned object.
}

inspectTable();
