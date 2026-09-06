import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarSeed: string;
  avatarAnimation: string;
  avatarFrame: string;
  siteTheme: string;
  particles: string;
  stars: number;
  ownedItems: string[];
};

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signup: (payload: { email: string; password: string; username: string }) => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  buyItem: (itemId: string) => Promise<void>;
  claimDailyStars: () => Promise<number>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await api<{ user: UserProfile | null }>("/api/auth/me");
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const signup = useCallback(async (payload: { email: string; password: string; username: string }) => {
    const result = await api<{ user: UserProfile }>("/api/auth/signup", { method: "POST", body: JSON.stringify(payload) });
    setUser(result.user);
  }, []);
  const login = useCallback(async (payload: { email: string; password: string }) => {
    const result = await api<{ user: UserProfile }>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
    setUser(result.user);
  }, []);
  const logout = useCallback(async () => { await api("/api/auth/logout", { method: "POST" }); setUser(null); }, []);
  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    const result = await api<{ user: UserProfile }>("/api/profile", { method: "PATCH", body: JSON.stringify(patch) });
    setUser(result.user);
  }, []);
  const buyItem = useCallback(async (itemId: string) => {
    const result = await api<{ user: UserProfile }>("/api/shop/buy", { method: "POST", body: JSON.stringify({ itemId }) });
    setUser(result.user);
  }, []);
  const claimDailyStars = useCallback(async () => {
    const result = await api<{ user: UserProfile; reward: number }>("/api/stars/daily", { method: "POST" });
    setUser(result.user);
    return result.reward;
  }, []);

  const value = useMemo(() => ({ user, loading, refresh, signup, login, logout, updateProfile, buyItem, claimDailyStars }), [user, loading, refresh, signup, login, logout, updateProfile, buyItem, claimDailyStars]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
