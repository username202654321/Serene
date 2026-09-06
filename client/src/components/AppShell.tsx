import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Gamepad2, Globe2, Home, Menu, MessageCircle, PackagePlus, Search, Settings2, Sparkles, X, ShoppingBag, UserRound, Star } from "lucide-react";
import { useSerene } from "@/contexts/SereneContext";
import { Wordmark } from "@/components/LogoMark";
import { useAuth } from "@/contexts/AuthContext";

const navGroups = [
  { label: "Discover", items: [
    { href: "/", label: "Home", icon: Home },
    { href: "/games", label: "Games", icon: Gamepad2 },
    { href: "/browser", label: "Browser", icon: Globe2 },
    { href: "/apps", label: "Apps", icon: Sparkles },
  ] },
  { label: "Community", items: [
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/search", label: "Search", icon: Search },
  ] },
  { label: "Create", items: [
    { href: "/studio", label: "Studio", icon: PackagePlus },
    { href: "/shop", label: "Shop", icon: ShoppingBag },
  ] },
];

const allNav = navGroups.flatMap((group) => group.items);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useSerene();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [peekOpen, setPeekOpen] = useState(false);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [ownerMode, setOwnerMode] = useState(() => localStorage.getItem("serene-owner-mode") !== "false");
  const [announcement, setAnnouncement] = useState(() => localStorage.getItem("serene-live-announcement") ?? "");
  const [draft, setDraft] = useState("");

  const sidebarOpen = !sidebarCollapsed || peekOpen;
  const pageName = useMemo(() => allNav.find((item) => location === item.href || (item.href !== "/" && location.startsWith(item.href)))?.label ?? "Settings", [location]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setMobileOpen(false);
        setAnnouncementsOpen(false);
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
      if (event.clientX <= 22 && sidebarCollapsed) setPeekOpen(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const clickable = target?.closest("button, a");
      if (!clickable || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = clickable.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "click-ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      clickable.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 520);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [sidebarCollapsed]);

  const go = (href: string) => {
    navigate(href);
    setMobileOpen(false);
    setCommandOpen(false);
  };

  const saveAnnouncement = () => {
    const value = draft.trim();
    if (!value) return;
    localStorage.setItem("serene-live-announcement", value);
    setAnnouncement(value);
    setDraft("");
  };

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-is-collapsed" : ""} ${peekOpen ? "sidebar-peek" : ""}`}>
      {announcement && <button className="live-announcement" onClick={() => setAnnouncementsOpen(true)}><span className="live-dot" /><span>{announcement}</span><X size={13} onClick={(event) => { event.stopPropagation(); localStorage.removeItem("serene-live-announcement"); setAnnouncement(""); }} /></button>}
      <aside className={`sidebar ${mobileOpen ? "mobile-is-open" : ""} ${sidebarOpen ? "is-open" : "is-closed"}`} onMouseEnter={() => sidebarCollapsed && setPeekOpen(true)} onMouseLeave={() => sidebarCollapsed && setPeekOpen(false)}>
        <div className="sidebar-top">
          <Link href="/" className="brand-link" onClick={() => setMobileOpen(false)}><Wordmark compact={!sidebarOpen} /></Link>
          <button className="icon-button sidebar-toggle" aria-label={sidebarCollapsed ? "Keep sidebar open" : "Collapse sidebar"} onClick={() => { setSidebarCollapsed(!sidebarCollapsed); setPeekOpen(false); }}><Menu size={17} /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navGroups.map((group) => <div className="sidebar-group" key={group.label}>
            <div className="nav-kicker">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return <Link key={item.href} href={item.href} className={`nav-item ${active ? "is-active" : ""}`} onClick={() => setMobileOpen(false)}><Icon size={17} strokeWidth={1.7} /><span>{item.label}</span></Link>;
            })}
          </div>)}
        </nav>
        <div className="sidebar-bottom">
          {user ? <Link href="/profile" className={`sidebar-presence ${location.startsWith("/profile") ? "is-active" : ""}`} onClick={() => setMobileOpen(false)}><UserRound size={17} /><span><strong>@{user.username}</strong><small><Star size={10} /> {user.stars.toLocaleString()} Stars</small></span></Link> : <Link href="/login" className="sidebar-presence" onClick={() => setMobileOpen(false)}><UserRound size={17} /><span><strong>Sign in</strong><small>save your Serene space</small></span></Link>}
          <button className="nav-item notification-nav" onClick={() => setAnnouncementsOpen(true)}><Bell size={17} strokeWidth={1.7} /><span>Notifications</span>{announcement && <i className="notification-pip" />}</button>
          <Link href="/settings" className={`nav-item ${location.startsWith("/settings") ? "is-active" : ""}`} onClick={() => setMobileOpen(false)}><Settings2 size={17} strokeWidth={1.7} /><span>Settings</span></Link>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <main className="app-main">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></button>
          <div className="topbar-context"><span className="topbar-page-name">{pageName}</span></div>
          <div className="topbar-actions"><button className="command-trigger" onClick={() => setCommandOpen(true)}><Search size={15} /><span>Search</span><kbd>⌘K</kbd></button><Link href="/settings" className="topbar-settings" aria-label="Open settings"><Settings2 size={18} /></Link></div>
        </header>
        <div className="page-frame">{children}</div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {allNav.slice(0, 5).map((item) => { const Icon = item.icon; const active = location === item.href || (item.href !== "/" && location.startsWith(item.href)); return <Link key={item.href} href={item.href} className={active ? "is-active" : ""}><Icon size={18} /><span>{item.label}</span></Link>; })}
      </nav>

      {commandOpen && <div className="command-overlay" role="dialog" aria-modal="true" aria-label="Search Serene" onClick={() => setCommandOpen(false)}><div className="command-panel" onClick={(event) => event.stopPropagation()}><div className="command-heading"><div><span className="eyebrow">Search</span><h2>Where to?</h2></div><button className="icon-button" onClick={() => setCommandOpen(false)} aria-label="Close search"><X size={18} /></button></div><button className="command-input-row" onClick={() => go("/search")}><Search size={17} /><span>Search games, apps and more</span><kbd>Enter</kbd></button><div className="command-links">{allNav.map((item) => { const Icon = item.icon; return <button key={item.href} onClick={() => go(item.href)}><Icon size={16} /><span>{item.label}</span></button>; })}</div></div></div>}

      {announcementsOpen && <div className="modal-overlay" onClick={() => setAnnouncementsOpen(false)}><section className="announcement-panel" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">Notifications</span><h2>What’s happening</h2></div><button className="icon-button" onClick={() => setAnnouncementsOpen(false)}><X size={17} /></button></div>{announcement ? <div className="current-announcement"><span className="live-dot" /><div><strong>{announcement}</strong><small>Live header announcement</small></div></div> : <div className="announcement-empty"><Bell size={20} /><span>No live announcements right now.</span></div>}{ownerMode && <div className="owner-announcement"><div className="owner-row"><div><strong>Owner controls</strong><small>Create a live announcement for the whole Serene UI.</small></div><button className="toggle is-on" onClick={() => { const next = !ownerMode; setOwnerMode(next); localStorage.setItem("serene-owner-mode", String(next)); }}><span /></button></div><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a short announcement…" /><div className="owner-actions"><button className="secondary-button small" onClick={() => { localStorage.removeItem("serene-live-announcement"); setAnnouncement(""); }}>Clear live</button><button className="primary-button small" onClick={saveAnnouncement}>Publish live</button></div></div>}</section></div>}
    </div>
  );
}
