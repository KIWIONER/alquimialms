import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Listing tables in nutricionista schema...');
    
    // We can't query information_schema directly via JS without RPC usually,
    // but we can try to query some standard tables or guess names.
    // Or we can try to use a common RPC if it exists.
    
    // Let's try to query the documents table AGAIN but definitely checking for non-nulls more broadly.
    const { count, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('*', { count: 'exact', head: true });

    console.log('Total rows in documentos:', count);

    // Let's try to see if there's any row at all with ANY data in ANY column.
    const { data: testData } = await supabase.schema('nutricionista').from('documentos').select('*');
    if (testData) {
        const rowWithData = testData.find(r => Object.values(r).some(v => v !== null && v !== "" && typeof v !== 'undefined' && (typeof v !== 'string' || v.length > 0)));
        if (rowWithData) {
            console.log('Found first row that is not completely empty:', JSON.stringify(rowWithData, null, 2));
        } else {
            console.log('ALL ROWS IN documentos ARE COMPLETELY EMPTY (except for IDs/Timestamps).');
        }
    }
}

listTables();
