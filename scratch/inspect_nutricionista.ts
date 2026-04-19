import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('--- Inspeccionando Eschema Nutricionista ---');
    
    // Intentar obtener columnas de nutricionista.documentos
    const { data: cols, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error al acceder a documentos:', error.message);
    } else if (cols && cols.length > 0) {
        console.log('Columnas en documentos:', Object.keys(cols[0]));
    } else {
        console.log('La tabla documentos está vacía o no tiene columnas accesibles.');
    }

    // Listar tablas en el esquema nutricionista (si es posible vía RPC o query directa)
    // Nota: A veces RPC 'get_tables' existe si se configuró
    const { data: tables, error: tableError } = await supabase.rpc('get_tables_by_schema', { schema_name: 'nutricionista' });
    if (tables) {
        console.log('Tablas en nutricionista:', tables);
    } else {
        // Fallback: check information_schema via a view or similar if available
    }
}

inspectSchema();
