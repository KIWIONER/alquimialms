import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoginForm from './LoginForm';

const AdminProtectedRoute = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(null);

    useEffect(() => {
        let isMounted = true;
        
        async function fetchSession() {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (isMounted) {
                setSession(currentSession);
                setLoading(false);
            }
        }

        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            if (isMounted) {
                setSession(currentSession);
                if (!currentSession) setIsAdmin(null);
            }
        });

        return () => { 
            isMounted = false; 
            subscription.unsubscribe(); 
        };
    }, []);

    useEffect(() => {
        if (!session) {
            setIsAdmin(null);
            return;
        }

        if (['matiasidiartviera@gmail.com', 'director@agencialquimia.com'].includes(session.user.email)) {
            setIsAdmin(true);
            return;
        }

        const checkAdmin = async () => {
            try {
                const { data, error } = await supabase.schema('nutricionista').from('admins').select('rol').eq('id', session.user.id).single();
                setIsAdmin(!error && data ? true : false);
            } catch (e) {
                setIsAdmin(false);
            }
        };

        checkAdmin();
    }, [session]);

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-white">
                 <div className="w-12 h-12 border-4 border-medical-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session) {
        return <LoginForm onLogin={setSession} />;
    }

    if (isAdmin === null) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-white">
                 <div className="w-12 h-12 border-4 border-medical-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isAdmin === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
                <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center animate-in fade-in zoom-in">
                    <div className="w-20 h-20 rounded-[2rem] bg-red-50 text-red-500 flex items-center justify-center text-4xl mx-auto mb-6 border border-red-100">🚫</div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Acceso Denegado</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 px-4">
                        Tu cuenta ({session.user.email}) no tiene permisos de administrador.
                    </p>
                    <button onClick={() => supabase.auth.signOut()} className="mt-8 w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all">Cerrar Sesión</button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminProtectedRoute;
