import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPublic() {
    console.log('Checking for documents in PUBLIC schema...');
    
    // Check if table 'documentos' exists in public
    const { data, error } = await supabase
        .from('documentos')
        .select('*');

    if (error) {
        console.log('Error or table NOT in public schema:', error.message);
    } else {
        console.log(`Found ${data.length} documents in public.documentos.`);
    }

    // Check if table 'temas' exists in public
    const { data: temas, error: tError } = await supabase
        .from('temas')
        .select('*');

    if (tError) {
        console.log('Table "temas" NOT in public schema.');
    } else {
        console.log(`Found ${temas.length} documents in public.temas.`);
    }
}

checkPublic();
