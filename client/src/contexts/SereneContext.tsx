import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { themeOptions, type ThemeId } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";

export type AppearanceSettings = {
  motion: number;
  light: number;
  grain: number;
  blur: number;
  compact: boolean;
  reducedMotion: boolean;
};

type BrowserTab = { id: string; title: string; url: string; loading?: boolean };

type SereneContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  recentGames: string[];
  markPlayed: (id: string) => void;
  appearance: AppearanceSettings;
  setAppearance: (patch: Partial<AppearanceSettings>) => void;
  browserTabs: BrowserTab[];
  activeBrowserTab: string;
  setActiveBrowserTab: (id: string) => void;
  addBrowserTab: () => void;
  closeBrowserTab: (id: string) => void;
  updateBrowserTab: (id: string, patch: Partial<BrowserTab>) => void;
  bookmarks: string[];
  addBookmark: (url: string, title?: string) => void;
  removeBookmark: (url: string) => void;
  browserHistory: string[];
  addHistory: (url: string, title?: string) => void;
  clearLocalData: () => void;
};

const STORAGE_KEY = "serene-state";
const defaultAppearance: AppearanceSettings = { motion: 52, light: 72, grain: 20, blur: 76, compact: false, reducedMotion: false };
const initialTab: BrowserTab = { id: "tab-1", title: "New tab", url: "serene://new-tab" };

type PersistedState = Partial<Pick<SereneContextValue, "theme" | "sidebarCollapsed" | "favorites" | "recentGames" | "appearance" | "browserTabs" | "activeBrowserTab" | "bookmarks" | "browserHistory">>;

function readState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function SereneProvider({ children }: { children: ReactNode }) {
  const [saved] = useState(readState);
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeId>((saved.theme as ThemeId) ?? "white");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(saved.sidebarCollapsed ?? true);
  const [favorites, setFavorites] = useState(saved.favorites ?? []);
  const [recentGames, setRecentGames] = useState(saved.recentGames ?? []);
  const [appearance, setAppearanceState] = useState<AppearanceSettings>({ ...defaultAppearance, ...(saved.appearance ?? {}) });
  const [browserTabs, setBrowserTabs] = useState<BrowserTab[]>(saved.browserTabs?.length ? saved.browserTabs : [initialTab]);
  const [activeBrowserTab, setActiveBrowserTab] = useState(saved.activeBrowserTab ?? initialTab.id);
  const [bookmarks, setBookmarks] = useState(saved.bookmarks ?? []);
  const [browserHistory, setBrowserHistory] = useState(saved.browserHistory ?? []);

  const setTheme = useCallback((nextTheme: ThemeId) => setThemeState(nextTheme), []);
  const toggleFavorite = useCallback((id: string) => setFavorites((current) => { const favorite = !current.includes(id); if (user) void fetch(`/api/games/${id}/activity`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ favorite }) }); return favorite ? [id, ...current] : current.filter((item) => item !== id); }), [user]);
  const markPlayed = useCallback((id: string) => { setRecentGames((current) => [id, ...current.filter((item) => item !== id)].slice(0, 6)); if (user) void fetch(`/api/games/${id}/activity`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ played: true }) }); }, [user]);
  const setAppearance = useCallback((patch: Partial<AppearanceSettings>) => setAppearanceState((current) => ({ ...current, ...patch })), []);
  const addBrowserTab = useCallback(() => {
    setBrowserTabs((tabs) => {
      const next = { id: `tab-${Date.now()}`, title: "New tab", url: "serene://new-tab" };
      setActiveBrowserTab(next.id);
      return [...tabs, next];
    });
  }, []);
  const closeBrowserTab = useCallback((id: string) => {
    setBrowserTabs((tabs) => {
      if (tabs.length === 1) return tabs;
      const index = tabs.findIndex((tab) => tab.id === id);
      const nextTabs = tabs.filter((tab) => tab.id !== id);
      if (activeBrowserTab === id) setActiveBrowserTab(nextTabs[Math.max(0, index - 1)].id);
      return nextTabs;
    });
  }, [activeBrowserTab]);
  const updateBrowserTab = useCallback((id: string, patch: Partial<BrowserTab>) => setBrowserTabs((tabs) => tabs.map((tab) => tab.id === id ? { ...tab, ...patch } : tab)), []);
  const addBookmark = useCallback((url: string, title = "") => {
    setBookmarks((current) => current.includes(url) ? current : [url, ...current]);
    if (user) void fetch("/api/bookmarks", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, title }) }).catch(() => undefined);
  }, [user]);
  const removeBookmark = useCallback((url: string) => {
    setBookmarks((current) => current.filter((item) => item !== url));
    if (user) void fetch("/api/bookmarks", { credentials: "include" }).then((response) => response.json() as Promise<{ bookmarks: { id: string; url: string }[] }>).then((result) => {
      const bookmark = result.bookmarks.find((item) => item.url === url);
      if (bookmark) void fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE", credentials: "include" });
    }).catch(() => undefined);
  }, [user]);
  const addHistory = useCallback((url: string, title = "") => { setBrowserHistory((current) => [url, ...current.filter((item) => item !== url)].slice(0, 30)); if (user) void fetch("/api/browser/history", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, title }) }); }, [user]);
  const clearLocalData = useCallback(() => {
    setFavorites([]); setRecentGames([]); setBookmarks([]); setBrowserHistory([]); setBrowserTabs([initialTab]); setActiveBrowserTab(initialTab.id);
  }, []);

  useEffect(() => {
    if (user?.siteTheme && themeOptions.some((item) => item.id === user.siteTheme)) setThemeState(user.siteTheme as ThemeId);
  }, [user?.siteTheme]);

  useEffect(() => {
    if (!user) return;
    void fetch("/api/bookmarks", { credentials: "include" }).then((response) => response.json() as Promise<{ bookmarks: { url: string }[] }>).then((result) => setBookmarks(result.bookmarks.map((item) => item.url))).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      fetch("/api/browser/history", { credentials: "include" }).then((response) => response.json() as Promise<{ history: { url: string }[] }>),
      fetch("/api/games/activity", { credentials: "include" }).then((response) => response.json() as Promise<{ activity: { gameId: string; favorite: boolean; lastPlayedAt: string | null }[] }>),
    ]).then(([historyResult, activityResult]) => { setBrowserHistory(historyResult.history.map((item) => item.url)); setFavorites(activityResult.activity.filter((item) => item.favorite).map((item) => item.gameId)); setRecentGames(activityResult.activity.filter((item) => item.lastPlayedAt).sort((a, b) => String(b.lastPlayedAt).localeCompare(String(a.lastPlayedAt))).map((item) => item.gameId).slice(0, 6)); }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    const option = themeOptions.find((item) => item.id === theme) ?? themeOptions[0];
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--accent", option.color);
    document.documentElement.style.setProperty("--accent-rgb", option.rgb);
    document.documentElement.style.setProperty("--motion-scale", `${appearance.reducedMotion ? 0.12 : appearance.motion / 52}`);
    document.documentElement.style.setProperty("--light-alpha", `${appearance.light / 100}`);
    document.documentElement.style.setProperty("--grain-alpha", `${appearance.grain / 100}`);
    document.documentElement.style.setProperty("--blur-amount", `${Math.max(18, appearance.blur)}px`);
    document.documentElement.style.setProperty("--theme-background", option.background);
    document.documentElement.style.setProperty("--theme-surface", option.surface);
    document.documentElement.style.setProperty("--theme-secondary", option.secondary);
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#050608"/><path d="M43 9c-4 2-7 7-7 13 0 11 8 20 19 20-5 8-14 13-24 13C16 55 5 44 5 29 5 16 14 5 27 3c6-1 11 1 16 6Z" fill="${option.color}"/></svg>`;
      icon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }
  }, [theme, appearance]);

  useEffect(() => {
    const payload: PersistedState = { theme, sidebarCollapsed, favorites, recentGames, appearance, browserTabs, activeBrowserTab, bookmarks, browserHistory };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [theme, sidebarCollapsed, favorites, recentGames, appearance, browserTabs, activeBrowserTab, bookmarks, browserHistory]);

  const value = useMemo(() => ({ theme, setTheme, sidebarCollapsed, setSidebarCollapsed, favorites, toggleFavorite, recentGames, markPlayed, appearance, setAppearance, browserTabs, activeBrowserTab, setActiveBrowserTab, addBrowserTab, closeBrowserTab, updateBrowserTab, bookmarks, addBookmark, removeBookmark, browserHistory, addHistory, clearLocalData }), [theme, setTheme, sidebarCollapsed, favorites, toggleFavorite, recentGames, markPlayed, appearance, setAppearance, browserTabs, activeBrowserTab, addBrowserTab, closeBrowserTab, updateBrowserTab, bookmarks, addBookmark, removeBookmark, browserHistory, addHistory, clearLocalData]);

  return <SereneContext.Provider value={value}>{children}</SereneContext.Provider>;
}

const SereneContext = createContext<SereneContextValue | null>(null);
export function useSerene() {
  const context = useContext(SereneContext);
  if (!context) throw new Error("useSerene must be used inside SereneProvider");
  return context;
}
