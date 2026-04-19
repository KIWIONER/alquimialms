import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findContent() {
    const { data, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('*')
        .not('contenido', 'is', null)
        .neq('contenido', '')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data.length > 0) {
        console.log('Document with content found:');
        console.log(`- ID: ${data[0].id}`);
        console.log(`- Nombre: "${data[0].nombre}"`);
        console.log(`- Carpeta: "${data[0].carpeta}"`);
        console.log(`- Longitud Contenido: ${data[0].contenido.length}`);
    } else {
        console.log('No documents with content found.');
    }
}

findContent();
