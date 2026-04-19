import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContent() {
    console.log('Checking for populated content...');
    const { data, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('id, nombre, carpeta, contenido')
        .not('contenido', 'is', null)
        .neq('contenido', '');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} documents with actual content.`);
    if (data.length > 0) {
        console.log('Sample content from first doc:', data[0].nombre, '->', data[0].contenido.substring(0, 100) + '...');
    }
}

checkContent();
