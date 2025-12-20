import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (_email: string) => {
        // For admin, we usually want email+password, but for simplicity let's stick to standard auth
        // The user mentioned "Enable Email/Password provider"
        // This function can be expanded if we need custom login logic, 
        // but the AdminVault will likely use the supabase auth UI or a simple form calling supabase.auth.signInWithPassword
        return;
    };

    const signOut = () => supabase.auth.signOut();

    return {
        session,
        user,
        loading,
        signIn,
        signOut,
    };
}
