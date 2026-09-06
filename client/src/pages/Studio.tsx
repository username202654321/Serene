import { useMemo, useState } from "react";
import { Bell, Check, Gamepad2, Globe2, LayoutGrid, PackagePlus, Send, Sparkles, Trash2, X } from "lucide-react";

const studioTabs = [
  { id: "publish", icon: PackagePlus, label: "Publish" },
  { id: "review", icon: Check, label: "Review" },
  { id: "announce", icon: Bell, label: "Announcements" },
  { id: "overview", icon: LayoutGrid, label: "Overview" },
];

type Submission = { id: string; type: "game" | "app"; name: string; description: string; url: string; status: "pending" | "published" | "rejected" };

const blank: Submission = { id: "", type: "game", name: "", description: "", url: "", status: "pending" };

export default function Studio() {
  const [tab, setTab] = useState("publish");
  const [form, setForm] = useState(blank);
  const [submissions, setSubmissions] = useState<Submission[]>(() => { try { return JSON.parse(localStorage.getItem("serene-submissions") || "[]"); } catch { return []; } });
  const [announcement, setAnnouncement] = useState("");
  const published = useMemo(() => submissions.filter((item) => item.status === "published"), [submissions]);

  const save = (next: Submission[]) => { setSubmissions(next); localStorage.setItem("serene-submissions", JSON.stringify(next)); };
  const publish = () => { if (!form.name.trim()) return; save([...submissions, { ...form, id: `${Date.now()}`, name: form.name.trim(), status: "published" }]); setForm(blank); };
  const review = (id: string, status: Submission["status"]) => save(submissions.map((item) => item.id === id ? { ...item, status } : item));
  const setLiveAnnouncement = () => { const value = announcement.trim(); if (!value) return; localStorage.setItem("serene-live-announcement", value); setAnnouncement(""); };

  return <div className="studio-page page-enter"><div className="page-title-row"><div><span className="eyebrow">Owner studio</span><h1>Build Serene.</h1><p>Publish games and web apps, review submissions, and control the live experience.</p></div><div className="page-title-mark"><span>{published.length.toString().padStart(2, "0")}</span><PackagePlus size={19} /></div></div><div className="studio-tabs">{studioTabs.map(({ id, icon: Icon, label }) => <button key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}><Icon size={15} />{label}</button>)}</div>{tab === "publish" && <section className="studio-card"><div className="studio-card-head"><div><span className="eyebrow">Create</span><h2>Publish a new item</h2></div><Sparkles size={18} /></div><div className="publish-type"><button className={form.type === "game" ? "is-active" : ""} onClick={() => setForm({ ...form, type: "game" })}><Gamepad2 size={15} /> Game</button><button className={form.type === "app" ? "is-active" : ""} onClick={() => setForm({ ...form, type: "app" })}><Globe2 size={15} /> Web app</button></div><div className="publish-form"><label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.type === "game" ? "Orbital Drift" : "DuckDuckGo"} /></label><label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A short description" /></label><label>URL<input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com" /></label><button className="primary-button" onClick={publish}><Send size={15} /> Publish {form.type}</button></div></section>}{tab === "review" && <section className="studio-card"><div className="studio-card-head"><div><span className="eyebrow">Moderation</span><h2>Review submissions</h2></div></div><div className="submission-list">{submissions.length === 0 ? <div className="studio-empty"><Sparkles size={20} /><span>No submissions yet.</span></div> : submissions.map((item) => <article key={item.id} className="submission-item"><div><span className="micro-tag">{item.type}</span><h3>{item.name}</h3><p>{item.description}</p><small>{item.url}</small></div><div className="submission-actions"><span className={`status-pill ${item.status}`}>{item.status}</span>{item.status === "pending" && <><button onClick={() => review(item.id, "published")}><Check size={14} /></button><button onClick={() => review(item.id, "rejected")}><X size={14} /></button></>}</div></article>)}</div></section>}{tab === "announce" && <section className="studio-card"><div className="studio-card-head"><div><span className="eyebrow">Live header</span><h2>Announce something</h2></div><Bell size={18} /></div><textarea className="announcement-editor" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="New game drop, maintenance, event, or update…" /><button className="primary-button" onClick={setLiveAnnouncement}><Bell size={15} /> Publish announcement</button><button className="danger-button small" onClick={() => localStorage.removeItem("serene-live-announcement")}><Trash2 size={14} /> Clear live announcement</button></section>}{tab === "overview" && <section className="studio-overview"><div><span>Published</span><strong>{published.length}</strong></div><div><span>Total submissions</span><strong>{submissions.length}</strong></div><div><span>Live announcement</span><strong>{localStorage.getItem("serene-live-announcement") ? "On" : "Off"}</strong></div></section>}</div>;
}
