import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Globe2, History, Home, List, Maximize2, Plus, RefreshCw, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { useSerene } from "@/contexts/SereneContext";
import { hasScramjetRuntime, resolveBrowserDestination } from "@/lib/browserAdapter";

type Navigation = { back: string[]; forward: string[] };
type HistoryEntry = { id: string; url: string; title: string; createdAt: string };
type BookmarkEntry = { id: string; url: string; title: string; createdAt: string };

function resolveInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+([/?].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}
function NewTab({ onNavigate }: { onNavigate: (value: string) => void }) {
  const [input, setInput] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); onNavigate(input); };
  return <div className="new-tab-view"><div className="new-tab-center"><div className="new-tab-mark"><Sparkles size={19} /></div><span className="eyebrow">Serene Browser</span><h1>Where to next?</h1><form className="new-tab-search" onSubmit={submit}><Globe2 size={17} /><input autoFocus value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search or enter an address" /><kbd>Enter</kbd></form><div className="shortcut-row"><button onClick={() => onNavigate("https://developer.mozilla.org")}><span>MDN</span> MDN Web Docs</button><button onClick={() => onNavigate("https://wikipedia.org")}><span>W</span> Wikipedia</button><button onClick={() => onNavigate("https://duckduckgo.com")}><span>DDG</span> DuckDuckGo</button></div></div></div>;
}
async function loadCollection<T>(path: string, fallback: T): Promise<T> { try { const response = await fetch(path, { credentials: "include" }); if (!response.ok) return fallback; return await response.json() as T; } catch { return fallback; } }

export default function Browser() {
  const { browserTabs, activeBrowserTab, setActiveBrowserTab, addBrowserTab, closeBrowserTab, updateBrowserTab, bookmarks, addBookmark, removeBookmark, addHistory } = useSerene();
  const [address, setAddress] = useState("");
  const [frameError, setFrameError] = useState("");
  const [navigation, setNavigation] = useState<Record<string, Navigation>>({});
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<"history" | "bookmarks" | "">("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [bookmarkItems, setBookmarkItems] = useState<BookmarkEntry[]>([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState("");
  const [filter, setFilter] = useState("");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const active = browserTabs.find((tab) => tab.id === activeBrowserTab) ?? browserTabs[0];
  const bookmarked = bookmarks.includes(active.url);
  const isNewTab = active.url === "serene://new-tab";
  const displayUrl = useMemo(() => active.url.replace(/^https?:\/\//, "").replace(/\/$/, ""), [active.url]);
  const destination = isNewTab ? null : resolveBrowserDestination(active.url);
  const currentNavigation = navigation[active.id] ?? { back: [], forward: [] };

  const refreshCollection = async (kind: "history" | "bookmarks") => {
    setCollectionLoading(true); setCollectionError("");
    if (kind === "history") {
      const result = await loadCollection<{ history: HistoryEntry[] }>("/api/browser/history", { history: [] });
      setHistory(result.history);
    } else {
      const result = await loadCollection<{ bookmarks: BookmarkEntry[] }>("/api/bookmarks", { bookmarks: [] });
      setBookmarkItems(result.bookmarks);
    }
    setCollectionLoading(false);
  };
  const openPanel = (kind: "history" | "bookmarks") => { const next = panel === kind ? "" : kind; setPanel(next); setFilter(""); if (next) void refreshCollection(next); };
  const navigate = (value: string, mode: "push" | "traverse" = "push") => {
    const raw = resolveInput(value);
    if (!raw) return;
    if (raw.startsWith("serene://")) { updateBrowserTab(active.id, { title: "New Tab", url: raw, loading: false }); return; }
    const resolved = resolveBrowserDestination(raw);
    const host = raw.replace(/^https?:\/\//, "").split("/")[0];
    setFrameError(resolved.runtime === "blocked" ? resolved.reason || "This destination cannot be displayed." : "");
    setLoading(resolved.runtime !== "blocked");
    if (mode === "push" && active.url !== raw) setNavigation((current) => ({ ...current, [active.id]: { back: [...(current[active.id]?.back || []), active.url], forward: [] } }));
    updateBrowserTab(active.id, { title: host || "Web Page", url: raw, loading: resolved.runtime !== "blocked" });
    setAddress("");
    if (mode === "push" && active.url !== raw) addHistory(raw, host);
  };
  const goBack = () => { const previous = currentNavigation.back.at(-1); if (!previous) return; setNavigation((current) => ({ ...current, [active.id]: { back: current[active.id].back.slice(0, -1), forward: [active.url, ...current[active.id].forward] } })); navigate(previous, "traverse"); };
  const goForward = () => { const next = currentNavigation.forward[0]; if (!next) return; setNavigation((current) => ({ ...current, [active.id]: { back: [...current[active.id].back, active.url], forward: current[active.id].forward.slice(1) } })); navigate(next, "traverse"); };
  const reload = () => { if (frameRef.current && destination?.runtime !== "blocked") { setLoading(true); frameRef.current.src = destination?.url || active.url; } };
  const deleteHistory = async (entry: HistoryEntry) => { await fetch(`/api/browser/history/${entry.id}`, { method: "DELETE", credentials: "include" }); setHistory((current) => current.filter((item) => item.id !== entry.id)); };
  const clearHistory = async () => { await fetch("/api/browser/history", { method: "DELETE", credentials: "include" }); setHistory([]); };
  const deleteBookmark = async (entry: BookmarkEntry) => { await fetch(`/api/bookmarks/${entry.id}`, { method: "DELETE", credentials: "include" }); setBookmarkItems((current) => current.filter((item) => item.id !== entry.id)); removeBookmark(entry.url); };
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") { event.preventDefault(); document.querySelector<HTMLInputElement>(".address-bar input")?.focus(); } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r") { event.preventDefault(); reload(); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); });

  const visibleHistory = history.filter((item) => `${item.title} ${item.url}`.toLowerCase().includes(filter.toLowerCase()));
  const visibleBookmarks = bookmarkItems.filter((item) => `${item.title} ${item.url}`.toLowerCase().includes(filter.toLowerCase()));
  return <div className="browser-page page-enter"><div className="browser-tabs"><div className="browser-tab-list">{browserTabs.map((tab) => <button key={tab.id} className={`browser-tab ${tab.id === active.id ? "is-active" : ""}`} onClick={() => setActiveBrowserTab(tab.id)}><span>{tab.loading ? <RefreshCw size={11} className="spin" /> : <Globe2 size={11} />}</span><span>{tab.title}</span>{browserTabs.length > 1 && <i onClick={(event) => { event.stopPropagation(); closeBrowserTab(tab.id); }}><X size={12} /></i>}</button>)}</div><button className="new-tab-button" onClick={addBrowserTab} aria-label="New Tab"><Plus size={15} /></button></div><div className="browser-toolbar"><div className="browser-controls"><button className="icon-button" disabled={!currentNavigation.back.length} onClick={goBack} aria-label="Back"><ArrowLeft size={16} /></button><button className="icon-button" disabled={!currentNavigation.forward.length} onClick={goForward} aria-label="Forward"><ArrowRight size={16} /></button><button className="icon-button" onClick={reload} aria-label="Reload"><RefreshCw size={15} /></button><button className="icon-button" onClick={() => navigate("serene://new-tab")} aria-label="Home"><Home size={16} /></button></div><form className="address-bar" onSubmit={(event) => { event.preventDefault(); navigate(address); }}><ShieldCheck size={14} /><input value={address || displayUrl} onChange={(event) => setAddress(event.target.value)} aria-label="Address" /><button type="button" onClick={() => bookmarked ? removeBookmark(active.url) : addBookmark(active.url, active.title)} disabled={isNewTab} aria-label={bookmarked ? "Remove Bookmark" : "Add Bookmark"}>{bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</button><button type="button" className={`icon-button ${panel === "bookmarks" ? "is-active" : ""}`} onClick={() => openPanel("bookmarks")} aria-label="Bookmarks"><List size={15} /></button><button type="button" className="icon-button" onClick={() => void frameRef.current?.requestFullscreen?.()} disabled={!destination || destination.runtime === "blocked"} aria-label="Fullscreen"><Maximize2 size={15} /></button><button type="button" className={`icon-button ${panel === "history" ? "is-active" : ""}`} onClick={() => openPanel("history")} aria-label="History"><History size={15} /></button></form></div>{panel && <aside className="browser-collection-panel"><div className="browser-collection-head"><strong>{panel === "history" ? "History" : "Bookmarks"}</strong><button className="icon-button" onClick={() => setPanel("")} aria-label="Close panel"><X size={15} /></button></div><div className="browser-collection-search"><Search size={13} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder={`Search ${panel}`} /></div>{panel === "history" && <button className="browser-collection-clear" onClick={() => void clearHistory()}>Clear History</button>}{collectionLoading ? <div className="browser-collection-empty">Loading...</div> : collectionError ? <div className="browser-collection-empty">{collectionError}</div> : (panel === "history" ? visibleHistory : visibleBookmarks).length ? <div className="browser-collection-list">{(panel === "history" ? visibleHistory : visibleBookmarks).map((entry) => <div className="browser-collection-item" key={entry.id}><button onClick={() => { setPanel(""); navigate(entry.url); }}><strong>{entry.title || entry.url.replace(/^https?:\/\//, "")}</strong><span>{entry.url}</span></button><button className="icon-button" onClick={() => panel === "history" ? void deleteHistory(entry as HistoryEntry) : void deleteBookmark(entry as BookmarkEntry)} aria-label="Delete entry"><X size={13} /></button></div>)}</div> : <div className="browser-collection-empty">No {panel} yet.</div>}</aside>}{isNewTab ? <div className="browser-viewport"><NewTab onNavigate={navigate} /></div> : frameError ? <div className="browser-viewport"><div className="browser-external-state"><ShieldCheck size={29} /><h2>Serene could not open this destination</h2><p>{frameError}</p><small>{hasScramjetRuntime() ? "Scramjet runtime configured." : "Proxy unavailable. Configure an authorized runtime for blocked destinations."}</small><a className="secondary-button small" href={active.url} target="_blank" rel="noreferrer">Open External Fallback</a></div></div> : <div className="browser-viewport"><div className="browser-embed">{loading && <div className="frame-hint">Loading inside Serene...</div>}<iframe ref={frameRef} title={active.title} src={destination?.url} onLoad={() => { setLoading(false); updateBrowserTab(active.id, { loading: false }); }} onError={() => { setLoading(false); setFrameError("The destination refused embedding or could not be reached."); updateBrowserTab(active.id, { loading: false }); }} allow="autoplay; fullscreen; clipboard-read; clipboard-write" referrerPolicy="no-referrer-when-downgrade" /><div className="browser-embed-bar"><ShieldCheck size={13} /><span>{destination?.runtime === "scramjet" ? "Browsing through the configured Scramjet runtime." : "Viewing inside Serene. Some sites may refuse embedding."}</span><a href={active.url} target="_blank" rel="noreferrer">Open Externally</a></div></div></div>}</div>;
}
