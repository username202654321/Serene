import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  Clipboard,
  Code2,
  FileJson,
  FileText,
  Gauge,
  Palette,
  QrCode,
  Timer,
  Watch,
  Wifi,
  BookOpen,
  Github,
  Search,
  Globe2,
} from "lucide-react";

export type Game = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  featured?: boolean;
  popularity: number;
  dateAdded: string;
  accent: string;
};

export type AppDefinition = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
};

export const games: Game[] = [
  {
    id: "orbital-drift",
    title: "Orbital Drift",
    description: "Thread a silent constellation through shifting gravity.",
    category: "Arcade",
    image: "/manus-storage/serene-games_8d91b126.jpg",
    featured: true,
    popularity: 98,
    dateAdded: "2026-08-24",
    accent: "#d8dbe2",
  },
  {
    id: "stillpoint",
    title: "Stillpoint",
    description: "A slow puzzle about attention, balance, and small moves.",
    category: "Puzzle",
    image: "/manus-storage/serene-browser_6c6017a4.jpg",
    featured: true,
    popularity: 92,
    dateAdded: "2026-08-28",
    accent: "#b6bfd4",
  },
  {
    id: "afterimage",
    title: "Afterimage",
    description: "Read the trace. Move before the light turns over.",
    category: "Reflex",
    image: "/manus-storage/serene-apps_1b21ef00.jpg",
    popularity: 86,
    dateAdded: "2026-08-30",
    accent: "#d9b8b0",
  },
  {
    id: "low-tide",
    title: "Low Tide",
    description: "Shape a quiet shoreline one current at a time.",
    category: "Strategy",
    image: "/manus-storage/serene-hero_29132c2d.jpg",
    popularity: 82,
    dateAdded: "2026-08-31",
    accent: "#b4c8c0",
  },
  {
    id: "signal-room",
    title: "Signal Room",
    description: "Tune a room of fragments into one clear frequency.",
    category: "Logic",
    image: "/manus-storage/serene-games_8d91b126.jpg",
    popularity: 74,
    dateAdded: "2026-09-01",
    accent: "#c5bdd5",
  },
  {
    id: "monument-valley",
    title: "Monument Valley",
    description: "A small architectural study in perspective and patience.",
    category: "Puzzle",
    image: "/manus-storage/serene-browser_6c6017a4.jpg",
    popularity: 68,
    dateAdded: "2026-09-02",
    accent: "#c9c0a8",
  },
];

export const appRegistry = [
  { id: "youtube", name: "YouTube", description: "Watch YouTube inside the Serene workspace when embedding is allowed.", category: "Watch", url: "https://www.youtube.com", icon: Globe2 },
  { id: "duckduckgo", name: "DuckDuckGo", description: "Search the web without leaving Serene.", category: "Search", url: "https://duckduckgo.com", icon: Search },
  { id: "wikipedia", name: "Wikipedia", description: "Read and explore the open encyclopedia.", category: "Read", url: "https://www.wikipedia.org", icon: BookOpen },
  { id: "github", name: "GitHub", description: "Browse public repositories inside Serene where framing is permitted.", category: "Build", url: "https://github.com", icon: Github },
  { id: "mdn", name: "MDN Web Docs", description: "Web platform documentation in a Serene tab.", category: "Build", url: "https://developer.mozilla.org", icon: Code2 },
] as const;

export const themeOptions = [
  { id: "white", label: "White", color: "#e7e9ee", rgb: "231, 233, 238", background: "#050608", surface: "#111319", secondary: "#8e96a6" },
  { id: "red", label: "Red", color: "#ef6d68", rgb: "239, 109, 104", background: "#090506", surface: "#171012", secondary: "#b58a8a" },
  { id: "blue", label: "Blue", color: "#6c9ef5", rgb: "108, 158, 245", background: "#05070b", surface: "#0f1420", secondary: "#8196b8" },
  { id: "purple", label: "Purple", color: "#ad8be8", rgb: "173, 139, 232", background: "#08060c", surface: "#15101e", secondary: "#a28cb9" },
  { id: "green", label: "Green", color: "#71c59b", rgb: "113, 197, 155", background: "#050a08", surface: "#0e1712", secondary: "#83ad98" },
  { id: "pink", label: "Pink", color: "#ed8fbc", rgb: "237, 143, 188", background: "#0a0609", surface: "#181018", secondary: "#b890a6" },
  { id: "orange", label: "Orange", color: "#e9a15d", rgb: "233, 161, 93", background: "#0a0805", surface: "#19130d", secondary: "#b49a7d" },
  { id: "cyan", label: "Cyan", color: "#70d6dc", rgb: "112, 214, 220", background: "#04090a", surface: "#0c1719", secondary: "#83b5b8" },
  { id: "yellow", label: "Yellow", color: "#e6c96c", rgb: "230, 201, 108", background: "#0a0905", surface: "#17150d", secondary: "#b1a87d" },
  { id: "hydrochrome", label: "Rainbow Hydrochrome", color: "#b9f6ff", rgb: "185, 246, 255", background: "#06060a", surface: "#11121a", secondary: "#b4a6d4" },
  { id: "pastel", label: "Pastel Dream", color: "#ffd8ef", rgb: "255, 216, 239", background: "#0b0a0d", surface: "#17141b", secondary: "#d4b7cb" },
  { id: "midnight", label: "Midnight Bloom", color: "#b89cff", rgb: "184, 156, 255", background: "#030308", surface: "#0e0b17", secondary: "#8877b5" },
] as const;

export type ThemeId = (typeof themeOptions)[number]["id"];
