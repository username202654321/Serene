import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Chrome, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import ProfileOrb from "@/components/ProfileOrb";

export default function Auth() {
  const [, navigate] = useLocation();
  const { user, signup, login } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const googleRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (user) navigate("/profile"); }, [user, navigate]);
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId || !googleRef.current) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      const google = (window as typeof window & { google?: any }).google;
      if (!google || !googleRef.current) return;
      google.accounts.id.initialize({ client_id: clientId, callback: async (response: { credential: string }) => {
        try {
          setBusy(true); setError("");
          const result = await fetch("/api/auth/google", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential: response.credential }) });
          const data = await result.json();
          if (!result.ok) throw new Error(data.error || "Google sign-in failed.");
          window.location.assign("/profile");
        } catch (err) { setError(err instanceof Error ? err.message : "Google sign-in failed."); } finally { setBusy(false); }
      } });
      google.accounts.id.renderButton(googleRef.current, { theme: "filled_black", size: "large", shape: "pill", width: 360 });
    };
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "signup") await signup({ email: email.trim(), password, username: username.trim() });
      else await login({ email: email.trim(), password });
      navigate("/profile");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not continue."); } finally { setBusy(false); }
  };

  return <div className="auth-page page-enter"><div className="auth-glow" /><section className="auth-card"><div className="auth-brand"><ProfileOrb username={username || "S"} size="sm" /><div><span className="eyebrow">Welcome to</span><strong>Serene</strong></div></div><div className="auth-heading"><span className="eyebrow">{mode === "login" ? "Sign in" : "Create account"}</span><h1>{mode === "login" ? "Come back to your space." : "Make your own space."}</h1><p>{mode === "login" ? "Sign in to keep your profile, Stars, themes, and shop items with you." : "Pick a username, collect Stars, and customize the whole Serene experience."}</p></div><div className="auth-switch"><button className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>Login</button><button className={mode === "signup" ? "is-active" : ""} onClick={() => setMode("signup")}>Sign up</button></div><form onSubmit={submit} className="auth-form">{mode === "signup" && <label><UserRound size={16} /><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" minLength={3} maxLength={20} required /></label>}<label><Mail size={16} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" required /></label><label><LockKeyhole size={16} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" minLength={8} required /></label>{error && <div className="auth-error">{error}</div>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={16} /></button></form><div className="auth-divider"><span>or</span></div><div className="google-slot" ref={googleRef}>{!import.meta.env.VITE_GOOGLE_CLIENT_ID && <button className="google-fallback" disabled><Chrome size={16} /> Google sign-in needs VITE_GOOGLE_CLIENT_ID</button>}</div><div className="auth-foot"><Sparkles size={14} /> Your Stars and customization are tied to your Serene account.</div></section></div>;
}
