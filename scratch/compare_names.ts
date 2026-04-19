import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function compareNames() {
    console.log('Comparing names in nutricionista.documentos...');
    const { data, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('nombre, contenido')
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    data.forEach(row => {
        const hasContent = row.contenido && row.contenido.length > 0;
        console.log(`- Nombre: "${row.nombre}" | Content: ${hasContent ? 'YES' : 'NO'}`);
    });
}

compareNames();
