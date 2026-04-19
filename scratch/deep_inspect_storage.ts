import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepInspect() {
    console.log('Deep inspecting dietetica-nutricion/alimentacion-equilibrada...');
    
    const { data: files, error } = await supabase
        .storage
        .from('cerebro-nutricionista')
        .list('dietetica-nutricion/alimentacion-equilibrada', { limit: 100 });
            
    if (error) {
        console.error(`Error:`, error);
        return;
    }
    
    console.log('Files found:');
    console.log(files.map(f => f.name));
}

deepInspect();
