import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllPdfs() {
    console.log('--- Listado de PDFs en Supabase Storage ---');
    const bucketName = 'cerebro-nutricionista';
    const rootPath = 'dietetica-nutricion';

    const { data: folders, error: folderError } = await supabase
        .storage
        .from(bucketName)
        .list(rootPath);

    if (folderError) {
        console.error('Error al listar carpetas raíz:', folderError);
        return;
    }

    for (const folder of folders) {
        if (folder.name === '.emptyFolderPlaceholder') continue;
        
        console.log(`\n📂 Carpeta: ${folder.name}`);
        const { data: files, error: fileError } = await supabase
            .storage
            .from(bucketName)
            .list(`${rootPath}/${folder.name}`);

        if (fileError) {
            console.error(`  Error en carpeta ${folder.name}:`, fileError);
            continue;
        }

        const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
        if (pdfs.length === 0) {
            console.log('  (Sin PDFs)');
        } else {
            pdfs.forEach(f => console.log(`  - 📄 ${f.name}`));
        }
    }
}

listAllPdfs();
