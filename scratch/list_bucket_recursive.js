import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
);

async function listAllRecursive(path = 'dietetica-nutricion') {
    const { data, error } = await supabase.storage
        .from('cerebro-nutricionista')
        .list(path);

    if (error) {
        console.error(`Error listing ${path}:`, error);
        return;
    }

    for (const item of data) {
        const fullPath = `${path}/${item.name}`;
        if (item.id === null) { // It's a folder
            console.log(`[FOLDER] ${fullPath}`);
            await listAllRecursive(fullPath);
        } else { // It's a file
            console.log(`[FILE] ${fullPath}`);
        }
    }
}

listAllRecursive();
