import { getLibraryStructure } from '../src/lib/books.ts';

async function verifyPaths() {
    const modules = await getLibraryStructure();
    const paths = [];

    for (const mod of modules) {
        for (const unit of mod.units) {
            paths.push({
                params: { module: mod.id, unit: unit.slug }
            });
        }
    }

    console.log('--- Generated Paths Audit ---');
    console.log(`Total units: ${paths.length}`);
    if (paths.length > 0) {
        console.log('First 3 paths:', JSON.stringify(paths.slice(0, 3), null, 2));
    }
    
    // Check specific problematic path
    const target = 'ud7-ii-alteraciones-bioquimicas-alimentos';
    const match = paths.find(p => p.params.unit === target);
    console.log(`Searching for ${target}:`, match ? 'FOUND' : 'NOT FOUND');
}

verifyPaths();
