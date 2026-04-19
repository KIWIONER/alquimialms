import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PUBLIC_SUPABASE_ANON_KEY);

async function checkAndAddOrder() {
    console.log("Comprobando columnas de documentos...");
    // Intentamos hacer un select de la columna 'orden' para ver si existe
    const { data, error } = await supabase.schema('nutricionista').from('documentos').select('id, orden').limit(1);
    
    if (error && error.message.includes('column "orden" does not exist')) {
        console.log("La columna 'orden' no existe. Hay que crearla o usar un método alternativo.");
    } else if (error) {
        console.error("Error inesperado:", error);
    } else {
        console.log("La columna 'orden' ya existe.");
    }
}

checkAndAddOrder();
