import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
);

async function listSchemas() {
    console.log('--- Listing visible items from public to check connectivity ---');
    const { data, error } = await supabase
        .from('documentos') // Try to query from public just in case
        .select('*')
        .limit(1);

    if (error) {
        console.log('Expected failure on public.documentos:', error.message);
    } else {
        console.log('Unexpected success on public.documentos! (Maybe schema is public?)');
    }

    console.log('\n--- Attempting to call a simple RPC to check API status ---');
    // Using a non-existent RPC to see the error message (contains context)
    const { error: rpcError } = await supabase.rpc('non_existent_function');
    console.log('RPC API Response:', rpcError?.message);
}

listSchemas();
