import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = 'cerebro-nutricionista';
const ROOT = 'dietetica-nutricion';

function slugify(text: string): string {
    return text
        .trim()
        .replace(/\.(pdf|PDF|docx|DOCX|doc|DOC|zip|ZIP)$/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase()
        .replace(/-$/, "")
        .replace(/^-/, "");
}

async function recover() {
    console.log('🚀 Iniciando recuperación de base de datos...');

    // 1. Borrar filas corruptas (donde nombre es null)
    console.log('🧹 Limpiando filas corruptas...');
    const { error: delError } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .delete()
        .is('nombre', null);
    
    if (delError) console.warn('Error al borrar filas vacías (puede que no hubiera ninguna):', delError);

    // 2. Obtener carpetas
    const { data: folders, error: fError } = await supabase.storage.from(BUCKET).list(ROOT);
    if (fError) throw fError;

    let totalInserted = 0;

    for (const folder of folders) {
        if (folder.name === '.emptyFolderPlaceholder') continue;
        console.log(`\n📂 Procesando carpeta: ${folder.name}`);

        const { data: files, error: fileError } = await supabase
            .storage
            .from(BUCKET)
            .list(`${ROOT}/${folder.name}`);

        if (fileError) {
            console.error(`Error en ${folder.name}:`, fileError);
            continue;
        }

        const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));

        for (const file of pdfs) {
            const fileName = file.name;
            const fullPath = `${ROOT}/${folder.name}/${fileName}`;
            
            // Construir URL pública (asumiendo que el bucket es público o usamos la URL base)
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${fullPath}`;

            console.log(`   📄 Insertando: ${fileName}`);

            const { error: insError } = await supabase
                .schema('nutricionista')
                .from('documentos')
                .insert({
                    nombre: fileName,
                    carpeta: folder.name,
                    url: publicUrl,
                    contenido: '' // El contenido se tendrá que volver a indexar vía n8n o manualmente
                });

            if (insError) {
                console.error(`     ❌ Error insertando ${fileName}:`, insError);
            } else {
                totalInserted++;
            }
        }
    }

    console.log(`\n✅ Recuperación completada. Se han restaurado ${totalInserted} documentos.`);
}

recover().catch(console.error);
