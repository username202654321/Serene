import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Gamepad2, Globe2, LayoutGrid, PackagePlus, Send, Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const studioTabs = [
  { id: "publish", icon: PackagePlus, label: "Publish" },
  { id: "review", icon: Check, label: "Review" },
  { id: "announce", icon: Bell, label: "Announcements" },
  { id: "overview", icon: LayoutGrid, label: "Overview" },
];

type Submission = { id: string; type: "game" | "app"; name: string; description: string; url: string; status: "pending" | "published" | "rejected" | "draft" };
type SubmissionForm = Pick<Submission, "type" | "name" | "description" | "url">;
const blank: SubmissionForm = { type: "game", name: "", description: "", url: "" };

async function studioApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Studio request failed.");
  return data;
}

export default function Studio() {
  const { user } = useAuth();
  const [tab, setTab] = useState("publish");
  const [form, setForm] = useState(blank);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const published = useMemo(() => submissions.filter((item) => item.status === "published"), [submissions]);

  const refresh = async () => {
    try {
      setLoading(true); setError("");
      const result = await studioApi<{ submissions: Submission[] }>("/api/studio/submissions");
      setSubmissions(result.submissions);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load Studio."); } finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);

  const publish = async () => {
    if (!form.name.trim()) return;
    try {
      setError("");
      await studioApi("/api/studio/submissions", { method: "POST", body: JSON.stringify(form) });
      setForm(blank); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not submit item."); }
  };
  const review = async (id: string, status: Submission["status"]) => {
    try { await studioApi(`/api/studio/submissions/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update submission."); }
  };
  const setLiveAnnouncement = async () => {
    const body = announcement.trim();
    if (!body) return;
    try { await studioApi("/api/announcements", { method: "POST", body: JSON.stringify({ body }) }); setAnnouncement(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not publish announcement."); }
  };

  return <div className="studio-page page-enter"><div className="page-title-row"><div><span className="eyebrow">Owner studio</span><h1>Build Serene.</h1><p>Publish games and web apps, review submissions, and control the live experience.</p></div><div className="page-title-mark"><span>{published.length.toString().padStart(2, "0")}</span><PackagePlus size={19} /></div></div><div className="studio-tabs">{studioTabs.map(({ id, icon: Icon, label }) => <button key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}><Icon size={15} />{label}</button>)}</div>{error && <div className="auth-error">{error}<button onClick={() => setError("")} aria-label="Dismiss"><X size={13} /></button></div>}{!user && <section className="studio-card"><div className="studio-empty">Sign in with an owner account to use Studio.</div></section>}{user && tab === "publish" && <section className="studio-card"><div className="studio-card-head"><div><span className="eyebrow">Create</span><h2>Publish a new item</h2></div><Sparkles size={18} /></div><div className="publish-type"><button className={form.type === "game" ? "is-active" : ""} onClick={() => setForm({ ...form, type: "game" })}><Gamepad2 size={15} /> Game</button><button className={form.type === "app" ? "is-active" : ""} onClick={() => setForm({ ...form, type: "app" })}><Globe2 size={15} /> Web app</button></div><div className="publish-form"><label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.type === "game" ? "Orbital Drift" : "DuckDuckGo"} /></label><label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A short description" /></label><label>URL<input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com" /></label><button className="primary-button" onClick={() => void publish()}><Send size={15} /> Submit {form.type}</button></div></section>}{user && tab === "review" && <section className="studio-card"><div className="studio-card-head"><div><span className="eyebrow">Moderation</span><h2>Review submissions</h2></div></div>{loading ? <div className="studio-empty">Loading submissions…</div> : <div className="submission-list">{submissions.length === 0 ? <div className="studio-empty">No submissions yet.</div> : submissions.map((item) => <article className="submission-row" key={item.id}><div><span className="eyebrow">{item.type} · {item.status}</span><strong>{item.name}</strong><p>{item.description}</p></div><div className="submission-actions"><button className="primary-button small" onClick={() => void review(item.id, "published")}>Approve</button><button className="danger-button small" onClick={() => void review(item.id, "rejected")}>Reject</button></div></article>)}</div>}</section>}{user && tab === "announce" && <section className="studio-card"><div className="studio-card-head"><div><span className="eyebrow">Live header</span><h2>Publish an announcement</h2></div><Bell size={18} /></div><textarea className="announcement-editor" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Share a concise update with Serene users." /><button className="primary-button" onClick={() => void setLiveAnnouncement()}><Send size={15} /> Publish announcement</button></section>}{user && tab === "overview" && <section className="studio-card"><div className="studio-card-head"><div><span className="eyebrow">Overview</span><h2>Serene catalog</h2></div><LayoutGrid size={18} /></div><div className="studio-overview"><strong>{published.length}</strong><span>published items</span><strong>{submissions.filter((item) => item.status === "pending").length}</strong><span>pending reviews</span></div></section>}</div>;
}
