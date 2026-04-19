import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Same logic as src/lib/content.js:splitIntoBlocks
 */
function splitIntoBlocks(text: string) {
    if (!text) return [];
    
    if (text.includes('## ')) {
        return text.split(/^##\s+/m).filter(Boolean).map((block, i) => {
            const lines = block.split('\n');
            const title = lines[0].trim();
            const content = lines.slice(1).join('\n').trim();
            return { title: title || `Sección ${i}`, content };
        });
    }

    return [{ title: 'Contenido', content: text.trim() }];
}

async function migrate() {
    console.log('🚀 Iniciando migración a tabla de tarjetas...');

    const { data: documents, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('id, nombre, contenido');

    if (error) {
        console.error('❌ Error cargando documentos:', error);
        return;
    }

    console.log(`📄 Encontrados ${documents.length} documentos.`);

    for (const doc of documents) {
        if (!doc.contenido) {
            console.log(`   - Saltando ${doc.nombre} (sin contenido)`);
            continue;
        }

        console.log(`   - Procesando ${doc.nombre}...`);
        
        // Clean text before migration (Atomic Compactness for bold)
        let cleanedContent = doc.contenido;
        // Simple JS version of my python regex: replace ** word ** with **word**
        cleanedContent = cleanedContent.replace(/\*\*\s*(.+?)\s*\*\*/gs, '**$1**');

        const blocks = splitIntoBlocks(cleanedContent);
        
        if (blocks.length === 0) continue;

        const tarjetasToInsert = blocks.map((b, index) => ({
            documento_id: doc.id,
            titulo: b.title,
            contenido: b.content,
            orden: index
        }));

        // Clean existing cards for this document if any (prevent duplicates if run twice)
        await supabase.schema('nutricionista').from('tarjetas').delete().eq('documento_id', doc.id);

        const { error: insertError } = await supabase
            .schema('nutricionista')
            .from('tarjetas')
            .insert(tarjetasToInsert);

        if (insertError) {
            console.error(`     [ERROR] al insertar tarjetas de ${doc.nombre}:`, insertError);
        } else {
            console.log(`     [OK] ${tarjetasToInsert.length} tarjetas creadas.`);
        }
    }

    console.log('\n✅ Migración completada con éxito.');
}

migrate();
