import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const LoginForm = ({ onLogin }) => {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'login') {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                if (onLogin) onLogin(data.session);
            } else {
                const { data, error } = await supabase.auth.signUp({ 
                    email, 
                    password,
                    options: {
                        emailRedirectTo: window.location.origin + '/admin'
                    }
                });
                if (error) throw error;
                setMessage('revisa tu email para confirmar la cuenta');
                setMode('login');
            }
        } catch (err) {
            setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
                <div className="p-10 pb-6 text-center border-b border-slate-50 bg-slate-50/50">
                    <div className="w-20 h-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-5xl mx-auto mb-6 border border-slate-100 italic transition-transform hover:rotate-12 duration-500">
                        🏺
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                        {mode === 'login' ? 'Acceso Admin' : 'Crear Cuenta'}
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Alquimia <span className="text-medical-green-600">LMS</span></p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-10 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email de Administrador</label>
                        <input 
                            type="email" 
                            name="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:border-medical-green-500 focus:bg-white transition-all shadow-inner font-medium"
                            placeholder="director@agencialquimia.com"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña Mestra</label>
                        <input 
                            type="password" 
                            name="password"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:border-medical-green-500 focus:bg-white transition-all shadow-inner font-medium"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                            <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                            </div>
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="p-4 bg-medical-green-50 border border-medical-green-100 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-medical-green-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-medical-green-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="text-[10px] font-black text-medical-green-600 uppercase tracking-tight">{message}</p>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>{mode === 'login' ? 'Entrar al Sanctum' : 'Registrar Admin'}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </>
                        )}
                    </button>

                    <button 
                        type="button"
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-medical-green-600 transition-colors py-2"
                    >
                        {mode === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                </form>
                
                <div className="px-10 pb-10 text-center">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                        Este es un panel de acceso restingido.<br/>
                        El acceso no autorizado será bloqueado.
                    </p>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
            `}} />
        </div>
    );
};

export default LoginForm;
