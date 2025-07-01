"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AuthForm from './AuthForm';

interface AuthWrapperProps {
    children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

    useEffect(() => {
        // Check current auth state
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <AuthForm
                mode={authMode}
                onToggleMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            />
        );
    }

    return <>{children}</>;
}