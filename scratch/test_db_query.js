import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
);

async function testQuery() {
    console.log('--- Testing nutricionista.documentos query ---');
    const { data, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('nombre, carpeta, url');

    if (error) {
        console.error('ERROR:', error);
        return;
    }

    console.log(`Success! Found ${data?.length} documents.`);
    if (data && data.length > 0) {
        console.log('Sample Document:', data[0]);
    }
}

testQuery();
