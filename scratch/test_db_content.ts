import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Querying documents...');
    const { data: allDocs, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('id, nombre, carpeta');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const total = allDocs.length;
    const emptyCount = allDocs.filter(d => !d.nombre || !d.carpeta).length;
    const validCount = total - emptyCount;

    console.log(`Total rows: ${total}`);
    console.log(`Empty rows (null nombre/carpeta): ${emptyCount}`);
    console.log(`Valid rows: ${validCount}`);
    
    if (validCount > 0) {
        console.log('Sample valid row:', allDocs.find(d => d.nombre && d.carpeta));
    }
}

test();
