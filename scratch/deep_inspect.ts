import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepInspect() {
    console.log('Deep inspection of documentos table...');
    const { data, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No data found in documentos.');
        return;
    }

    console.log('Found', data.length, 'rows.');
    
    // Check if ANY row has non-null values for ANY key
    const allKeys = new Set<string>();
    data.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
    
    console.log('All columns found:', Array.from(allKeys));

    const stats: Record<string, number> = {};
    allKeys.forEach(k => {
        stats[k] = data.filter(row => row[k] !== null && row[k] !== '').length;
    });

    console.log('Non-empty counts per column:', stats);
    
    if (stats.nombre === 0 && stats.tema_titulo === 0) {
        console.log('CRITICAL: Both nombre and tema_titulo are completely empty.');
    } else {
        console.log('Sample data for nombre:', data.find(d => d.nombre)?.nombre);
        console.log('Sample data for tema_titulo:', data.find(d => d.tema_titulo)?.tema_titulo);
    }
}

deepInspect();
