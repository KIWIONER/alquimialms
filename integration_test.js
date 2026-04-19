/**
 * Alquimia - Integration Test
 * Script para verificar la conexión con el webhook de n8n.
 * Ejecución: node integration_test.js
 */

const axios = require('axios'); // Asegúrate de tener axios instalado
const CONFIG = require('./config');

async function testConnection() {
    console.log('--- Probando Conexión con n8n ---');
    console.log(`URL de Destino: ${CONFIG.N8N_WEBHOOK_URL}`);

    const payload = {
        query: 'Hola Profesor, ¿cuál es la importancia de la hidratación en el deporte?',
        user: 'Tester',
        timestamp: new Date().toISOString()
    };

    try {
        const response = await axios.post(CONFIG.N8N_WEBHOOK_URL, payload);
        console.log('✅ Éxito: El servidor respondió.');
        console.log('Respuesta:', response.data);
    } catch (error) {
        console.error('❌ Error en la conexión:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        console.log('\nNota: Asegúrate de que el webhook de n8n esté activo y acepte peticiones POST.');
    }
}

// Para ejecutarlo, descomenta la línea de abajo o cámbialo a un formato compatible:
// testConnection();

console.log('Script de prueba preparado. Configura tu URL en config.js antes de ejecutar.');
