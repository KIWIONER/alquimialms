require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function main() {
    try {
        const { data, error } = await supabase.schema('nutricionista').from('documentos')
            .select('id, nombre, tarjetas(id)')
            .limit(1);
        
        if (error) {
            console.error("Supabase Query Error:", error.message);
            console.error("Full Error:", error);
        } else {
            console.log("Query Successful. Found cards for one doc:", data[0]?.tarjetas?.length);
        }
    } catch (e) {
        console.error("Runtime Exception:", e);
    }
}
main();
