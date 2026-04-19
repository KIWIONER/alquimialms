import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const webhookUrl = process.env.PUBLIC_N8N_CEREBRO_URL;

const supabase = createClient(supabaseUrl, supabaseKey);

const toKebabCase = (str) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-/]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

async function syncAll() {
    console.log('--- Sincronización Masiva con Cerebro (n8n) ---');
    
    const { data: docs, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('*')
        .not('contenido', 'is', null);

    if (error) {
        console.error('Error al obtener documentos:', error);
        return;
    }

    console.log(`Encontrados ${docs.length} documentos para sincronizar.`);

    for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        const cleanName = doc.nombre.replace(/\.(pdf|PDF|docx|DOCX)$/, '');
        const slug = toKebabCase(`${doc.carpeta}/${cleanName}`);

        console.log(`[${i+1}/${docs.length}] Sincronizando: ${slug}...`);

        try {
            const payload = {
                action: 'upsert_document',
                doc_id: doc.id,
                slug: slug,
                filename: doc.nombre,
                folder: doc.carpeta,
                url: doc.url,
                content: doc.contenido
            };

            const response = await axios.post(webhookUrl, payload);
            
            if (response.status === 200) {
                console.log(`   ✅ Éxito`);
            } else {
                console.log(`   ⚠️ Respuesta inesperada: ${response.status}`);
            }
        } catch (err) {
            console.error(`   ❌ Error en ${slug}:`, err.message);
        }

        // Delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✨ Sincronización completada.');
}

if (!webhookUrl) {
    console.error('ERROR: PUBLIC_N8N_CEREBRO_URL no está definido en el .env');
} else {
    syncAll().catch(console.error);
}
