import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectFolder() {
    console.log('Inspecting Cerebro-Nutricionista / dietetica-nutricion...');
    
    // Check if dietetica-nutricion is a folder
    const { data: folders, error: folderError } = await supabase
        .storage
        .from('cerebro-nutricionista')
        .list('dietetica-nutricion', { limit: 100 });
            
    if (folderError) {
        console.error(`Error listing folder:`, folderError);
        return;
    }
    
    console.log('Files found in dietetica-nutricion:');
    console.log(folders.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => f.name));
    console.log('Total files:', folders.length);
}

inspectFolder();
