import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTableWithContent() {
    console.log('Searching all tables in nutricionista schema...');
    
    // Attempting to list all tables through a generic query or common names
    const tables = ['documentos', 'temas', 'unidades', 'libros', 'biblioteca'];
    
    for (const table of tables) {
        const { data, error } = await supabase
            .schema('nutricionista')
            .from(table)
            .select('*')
            .limit(1);
            
        if (error) {
            console.log(`Table "${table}" not found or no access.`);
            continue;
        }
        
        console.log(`Table "${table}" exists. Rows found: ${data.length}`);
        if (data.length > 0) {
            const hasContent = Object.values(data[0]).some(v => v && typeof v === 'string' && v.length > 50);
            console.log(`  Sample data has long text content: ${hasContent}`);
            if (hasContent) {
                 console.log(`  Sample row keys: ${Object.keys(data[0])}`);
            }
        }
    }
}

findTableWithContent();
