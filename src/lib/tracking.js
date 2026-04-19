import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const trackEvent = async (eventName, details = {}) => {
    try {
        const { data, error } = await supabase
            .from('tracking')
            .insert([
                { 
                    event_name: eventName, 
                    details: details,
                    timestamp: new Date().toISOString()
                }
            ]);
        
        if (error) throw error;
        console.log(`Tracked: ${eventName}`, details);
    } catch (err) {
        console.error('Tracking Error:', err.message);
    }
};
