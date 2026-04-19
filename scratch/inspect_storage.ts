import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectStorage() {
    console.log('Inspecting Storage...');
    
    const { data: buckets, error } = await supabase
        .storage
        .listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    console.log('Buckets found:', buckets.map(b => b.name));

    for (const bucket of buckets) {
        console.log(`\nFiles in bucket "${bucket.name}":`);
        const { data: files, error: fileError } = await supabase
            .storage
            .from(bucket.name)
            .list('', { limit: 10 });
            
        if (fileError) {
            console.error(`Error listing files in ${bucket.name}:`, fileError);
            continue;
        }
        
        console.log(files.map(f => f.name));
    }
}

inspectStorage();
