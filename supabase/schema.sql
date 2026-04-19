-- Tablas para el Motor LMS de Alquimia

-- 1. Intentos de Cuestionario
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    unit_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    is_pass BOOLEAN NOT NULL,
    session_id UUID NOT NULL, -- Para agrupar intentos en la misma sesión
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Historial de Notificaciones y Triggers
CREATE TABLE IF NOT EXISTS lms_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL, -- e.g., 'fail_trigger'
    unit_id TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar Realtime para notificaciones y mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE lms_notifications;

-- 4. Función para detectar 3 fallos seguidos en la misma sesión
CREATE OR REPLACE FUNCTION check_failed_attempts()
RETURNS TRIGGER AS $$
DECLARE
    fail_count INTEGER;
BEGIN
    -- Contar fallos seguidos para el mismo usuario, unidad y sesión
    SELECT COUNT(*) INTO fail_count
    FROM (
        SELECT is_pass
        FROM quiz_attempts
        WHERE user_id = NEW.user_id 
          AND unit_id = NEW.unit_id
          AND session_id = NEW.session_id
        ORDER BY created_at DESC
        LIMIT 3
    ) AS last_attempts
    WHERE is_pass = FALSE;

    -- Si hay 3 fallos exactos (para evitar disparar en el 4º, 5º, etc. innecesariamente)
    IF fail_count = 3 THEN
        INSERT INTO lms_notifications (user_id, type, unit_id, message)
        VALUES (NEW.user_id, 'fail_trigger', NEW.unit_id, 'Refuerzo pedagógico necesario');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger que se dispara tras cada intento
CREATE TRIGGER tr_check_failures
AFTER INSERT ON quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION check_failed_attempts();
