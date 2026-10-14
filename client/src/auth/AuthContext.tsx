import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate } from "react-router-dom";
import { supabase } from "./authClient";

export interface AppProfile {
  id: string;
  displayName: string | null;
  email: string | null;
  isPlatformAdmin: boolean;
  tenantId: string | null;
  roles: { role: string; scopeType?: string | null; scopeId?: string | null }[];
}

interface AuthCtx {
  session: Session | null;
  profile: AppProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/auth/me`, {
        headers: { Authorization: `Bearer ${s.access_token}` },
      });
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch {
      console.error("Failed to fetch profile");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      fetchProfile(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      fetchProfile(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return <Ctx.Provider value={{ session, profile, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}