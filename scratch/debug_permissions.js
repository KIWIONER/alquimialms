import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
);

async function checkPermissions() {
    console.log('Checking current user role...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Auth User:', user ? user.email : 'None (Anon/Public)');

    console.log('--- Querying nutricionista.documentos ---');
    const { data, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('*');

    if (error) {
        console.error('DATABASE ERROR:', error.code, error.message);
        if (error.code === '42501') {
            console.log('\n[!] BLOQUEADOR: El permiso SELECT en la tabla "documentos" del esquema "nutricionista" est siendo bloqueado.');
            console.log('Posibles causas:');
            console.log('1. RLS (Row Level Security) est activado en esa tabla y no hay una poltica para "public/anon".');
            console.log('2. El comando GRANT no se aplic correctamente al rol "anon".');
        }
    } else {
        console.log(`SUCCESS! Received ${data?.length} records.`);
    }
}

checkPermissions();
