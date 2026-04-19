import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectFirst() {
    const { data, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data.length > 0) {
        const row = data[0];
        for (const [key, value] of Object.entries(row)) {
            const valStr = String(value);
            console.log(`${key}: [Type: ${typeof value}] [Length: ${valStr.length}]`);
            if (valStr.length > 50) {
                console.log(`  Value Preview: ${valStr.substring(0, 100)}...`);
            }
        }
    }
}

inspectFirst();
