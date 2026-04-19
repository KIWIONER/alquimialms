/**
 * SHARED CONTENT LOGIC
 * Used by DocumentEditor (Admin) and LessonContentViewer (Student)
 */

// True if a line "belongs" to the index block (empty, page number, or numbered item or contains TOC dots)
export const isIndexLine = (line) => {
    const t = line.trim();
    if (!t) return true;
    if (/^\d+/.test(t)) return true; // Starts with number
    if (/^\d/.test(t)) return true;  // Starts with number (e.g. 1.1)
    if (t.includes('....')) return true; // Contains TOC dots
    if (/\d+$/.test(t)) return true; // Ends with number (page number)
    return false;
};

export const isIndexTitle = (line) => {
    const t = line.trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[:\s]+$/, '');
    return (
        t === 'indice' || t === 'indices' || t === 'tabla de contenidos' || 
        t === 'tabla de contenido' || t === 'taboa de contidos' || 
        t === 'taboa de contido' || t === 'table of contents' || 
        t === 'contenidos' || t === 'contidos' || t === 'sumario' || 
        t === 'summary' || t === 'indice de contenidos' || t === 'indice de contidos'
    );
};

export const isSectionHeader = (line) => {
    const t = line.trim();
    if (!t) return false;
    if (/^\d+$/.test(t)) return false;
    // Common section patterns: 1. Title, 1.1 Title, Unit 1, etc.
    if (/^\d+(\.\d+)*[\.\)]\s+[A-ZÁÉÍÓÚÑ]/.test(t)) return true;
    if (/^(UNIDADE|UNIDAD|CAPÍTULO|CAPITULO|TEMA|MÓDULO|MODULO|BLOQUE)\s+\d+/i.test(t)) return true;
    // Strict uppercase headers
    if (t === t.toUpperCase() && t.length >= 4 && t.length <= 60 && /[A-ZÁÉÍÓÚÑ]/.test(t) && !t.includes('....')) return true;
    return false;
};

/**
 * Splits raw markdown or plain text into structured blocks (cards)
 */
export const splitIntoBlocks = (text) => {
    if (!text) return [{ id: Date.now(), title: 'Inicio', content: '' }];
    
    // If it's already structured with ## markers
    if (text.includes('## ')) {
        return text.split(/^##\s+/m).filter(Boolean).map((block, i) => {
            const lines = block.split('\n');
            const title = lines[0].trim();
            const content = lines.slice(1).join('\n').trim();
            return { 
                id: i + Date.now(), 
                title: title || (i === 0 ? 'Índice' : `Sección ${i}`), 
                content 
            };
        });
    }

    // Fallback logic for raw PDF extraction without markers
    const lines = text.split('\n');
    const sections = [];
    let curTitle = null, curLines = [], inIndex = false;

    const push = () => {
        const body = curLines.join('\n').trim();
        if (curTitle || body) {
            sections.push({ 
                id: sections.length + Date.now(), 
                title: curTitle || 'Contenido', 
                content: body 
            });
        }
        curTitle = null; curLines = [];
    };

    for (const line of lines) {
        if (isIndexTitle(line)) { 
            push(); 
            curTitle = line.trim(); 
            inIndex = true; 
        }
        else if (inIndex && isIndexLine(line)) { 
            curLines.push(line); 
        }
        else if (inIndex && !isIndexLine(line)) { 
            inIndex = false; 
            push(); 
            if (isSectionHeader(line)) curTitle = line.trim(); 
            else curLines = [line]; 
        }
        else if (!inIndex && isSectionHeader(line)) { 
            push(); 
            curTitle = line.trim(); 
        }
        else { 
            curLines.push(line); 
        }
    }
    push();
    return sections;
};

export const joinBlocks = (blocks) => blocks.map(b => `## ${b.title}\n${b.content}`).join('\n\n');

export const toKebabCase = (str) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-/]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};
