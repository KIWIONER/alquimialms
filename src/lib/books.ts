import { supabase } from './supabase';

export interface Unit {
    nombre: string;
    url: string;
    carpeta: string;
    slug: string;
    completado?: boolean;
}

export interface Module {
    id: string; // carpeta
    name: string; // carpeta (cleaned)
    units: Unit[];
    firstUnit?: Unit;
}

export function slugify(text: string): string {
    return text
        .trim()
        .replace(/\.(pdf|PDF|docx|DOCX|doc|DOC|zip|ZIP)$/, "") // Quitar extensiones
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/[^a-zA-Z0-9-]/g, "-") // Reemplazar caracteres raros por guiones (ya no mantenemos el punto)
        .replace(/-+/g, "-") // Evitar guiones dobles
        .toLowerCase()
        .replace(/-$/, "") // Quitar guion final si quedara
        .replace(/^-/, ""); // Quitar guion inicial si quedara
}

/**
 * Obtiene toda la estructura de la biblioteca desde la base de datos (esquema nutricionista),
 * opcionalmente cruzada con el progreso del estudiante.
 */
export async function getLibraryStructure(userId: string = 'estudiante-demo'): Promise<Module[]> {
    const { data: documents, error: docError } = await supabase
        .schema('nutricionista')
        .from('documentos')
        .select('nombre, carpeta, url')
        .order('carpeta', { ascending: true })
        .order('nombre', { ascending: true });

    if (docError) {
        console.error('Error fetching library from database:', docError);
        return [];
    }

    // Obtener progreso del estudiante
    const { data: progress, error: progError } = await supabase
        .schema('nutricionista')
        .from('pasos_completados')
        .select('document_slug')
        .eq('user_id', userId);

    if (progError) {
        console.warn('Student progress not found or table missing. Defaulting to unread.', progError.message);
    }

    const completedSlugs = new Set((progress || []).map(p => p.document_slug));

    // Agrupar por carpeta
    const agrupados = (documents as Unit[]).reduce((acc: Record<string, Module>, doc) => {
        // Protección contra nulos para evitar el error "Cannot read properties of null (reading 'trim')"
        const carpetaRaw = doc.carpeta || 'Sin Carpeta';
        const nombreRaw = doc.nombre || 'Documento sin nombre';
        
        const carpetaId = carpetaRaw.trim().toLowerCase();
        const nombreLimpio = nombreRaw.trim();
        
        if (nombreLimpio === '.emptyFolderPlaceholder') return acc;

        const slug = slugify(nombreLimpio);

        if (!acc[carpetaId]) {
            acc[carpetaId] = {
                id: carpetaId,
                name: carpetaId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                units: []
            };
        }
        acc[carpetaId].units.push({
            ...doc,
            nombre: nombreLimpio,
            carpeta: carpetaId,
            slug,
            completado: completedSlugs.has(slug)
        });
        return acc;
    }, {});

    return Object.values(agrupados).map(mod => ({
        ...mod,
        firstUnit: mod.units[0]
    }));
}

/**
 * Obtiene el total de documentos indexados (excluyendo placeholders).
 */
export async function getTotalDocumentCount(): Promise<number> {
    const structure = await getLibraryStructure();
    return structure.reduce((total, mod) => total + mod.units.length, 0);
}

/**
 * Helpers para compatibilidad con componentes existentes
 */
export async function getModules(): Promise<Module[]> {
    return await getLibraryStructure();
}

export async function getModuleUnits(moduleId: string): Promise<string[]> {
    const structure = await getLibraryStructure();
    const module = structure.find(m => m.id === moduleId);
    return module ? module.units.map(u => u.nombre) : [];
}

export async function getUnitByName(moduleId: string, unitName: string): Promise<Unit | null> {
    const structure = await getLibraryStructure();
    const module = structure.find(m => m.id === moduleId);
    if (!module) return null;
    return module.units.find(u => u.nombre === unitName) || null;
}

export function getUnitUrlByRecord(unit: Unit) {
    return unit.url;
}

// Mantener para compatibilidad mientras se refactorizan rutas
export async function getUnitUrl(moduleId: string, unitName: string): Promise<string> {
    const unit = await getUnitByName(moduleId, unitName);
    return unit ? unit.url : '';
}

/**
 * Toggles the read status of a unit in Supabase.
 */
export async function toggleUnitProgress(slug: string, isRead: boolean, userId: string = 'estudiante-demo') {
    if (isRead) {
        return await supabase
            .schema('nutricionista')
            .from('pasos_completados')
            .upsert({ user_id: userId, document_slug: slug });
    } else {
        return await supabase
            .schema('nutricionista')
            .from('pasos_completados')
            .delete()
            .match({ user_id: userId, document_slug: slug });
    }
}
