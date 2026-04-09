import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Role = 'user' | 'pharmacy';

type AuthContextType = {
  user: User | null;
  role: Role | null;
  loading: boolean;
  signUpUser: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpPharmacy: (email: string, password: string, pharmacyName: string, licenseNumber: string) => Promise<{ error: Error | null }>;
  signInUser: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInPharmacy: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch role from your profiles table in Supabase
  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setRole(data.role as Role);
    } else {
      setRole(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) fetchRole(sessionUser.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) fetchRole(sessionUser.id);
      else setRole(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- User Signup ---
  const signUpUser = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      // Insert into profiles table with role = 'user'
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        role: 'user',
      });
    }
    return { error: error as Error | null };
  };

  // --- Pharmacy Signup ---
  const signUpPharmacy = async (
    email: string,
    password: string,
    pharmacyName: string,
    licenseNumber: string
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      // Insert into profiles table with role = 'pharmacy'
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        role: 'pharmacy',
        pharmacy_name: pharmacyName,
        license_number: licenseNumber,
      });
    }
    return { error: error as Error | null };
  };

  // --- User Login ---
  const signInUser = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // Block pharmacy accounts from logging in via user login
      if (profile?.role === 'pharmacy') {
        await supabase.auth.signOut();
        return { error: new Error('Please use the Pharmacy Login page.') };
      }
    }

    return { error: error as Error | null };
  };

  // --- Pharmacy Login ---
  const signInPharmacy = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // Block user accounts from logging in via pharmacy login
      if (profile?.role !== 'pharmacy') {
        await supabase.auth.signOut();
        return { error: new Error('This account is not registered as a pharmacy.') };
      }
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signUpUser, signUpPharmacy, signInUser, signInPharmacy, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
