const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
let pdf = require('pdf-parse');
if (typeof pdf !== 'function' && pdf.default) pdf = pdf.default;
require('dotenv').config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function processSubject(subjectName) {
    console.log(`🚀 Procesando asignatura: ${subjectName}`);

    const { data: docs, error } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('*')
        .eq('carpeta', subjectName);

    if (error) {
        console.error('Error al obtener documentos:', error);
        return;
    }

    console.log(`Encontrados ${docs.length} documentos.`);

    for (const doc of docs) {
        if (doc.contenido && doc.contenido.length > 500) {
            console.log(`⏩ Saltando ${doc.nombre} (ya tiene contenido)`);
            continue;
        }

        console.log(`📄 Procesando: ${doc.nombre}...`);
        
        try {
            const response = await axios.get(doc.url, { responseType: 'arraybuffer' });
            const data = await pdf(response.data);
            
            const lines = data.text.split('\n');
            let structuredText = '';
            let currentChunk = '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                // Detectar posibles títulos (Números, índices, mayúsculas cortas)
                const isTitle = /^\d+(\.\d+)*\s+[A-Z\u00C0-\u00DC]/.test(trimmed) || 
                                (trimmed.length < 60 && trimmed === trimmed.toUpperCase() && trimmed.length > 4);

                if (isTitle && currentChunk.length > 200) {
                    structuredText += `\n\n## ${trimmed}\n${currentChunk}`;
                    currentChunk = '';
                } else if (isTitle) {
                    structuredText += `\n\n## ${trimmed}\n`;
                } else {
                    currentChunk += trimmed + ' ';
                }
            }
            if (currentChunk) structuredText += `\n${currentChunk}`;

            const finalContent = structuredText.trim();

            const { error: updError } = await supabase
                .schema('nutricionista')
                .from('documentos')
                .update({ contenido: finalContent })
                .eq('id', doc.id);

            if (updError) throw updError;
            console.log(`   ✅ Completado (${finalContent.length} caracteres)`);

        } catch (err) {
            console.error(`   ❌ Error en ${doc.nombre}:`, err.message);
        }
    }

    console.log('\n✨ Fin del procesamiento para la asignatura.');
}

const targetSubject = process.argv[2] || 'alimentacion-equilibrada';
processSubject(targetSubject).catch(console.error);
