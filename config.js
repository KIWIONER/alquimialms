/**
 * Alquimia - Configuración del Proyecto
 * Estas variables conectan la interfaz con los servicios externos.
 */

const CONFIG = {
    // URL del webhook de n8n para procesar chats y consultas
    N8N_WEBHOOK_URL: 'https://tu-n8n.ejemplo.com/webhook/alquimia-chat',
    
    // Configuración de Supabase (Opcional si n8n maneja todo)
    SUPABASE: {
        URL: 'https://tu-proyecto.supabase.co',
        ANON_KEY: 'tu-anon-key-aqui',
        BUCKET_NAME: 'libros-dietetica'
    },

    // Ajustes del Profesor
    PROFESSOR: {
        NAME: 'Profesor Alquimia',
        ROLE: 'Experto en Nutrición y Dietética',
        LANGUAGE: 'es-ES'
    }
};

// Exportar configuración si se usa en un entorno de módulos, 
// o dejar disponible globalmente para scripts simples.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.APP_CONFIG = CONFIG;
}
