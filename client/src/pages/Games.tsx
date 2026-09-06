import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Filter, Heart, Play, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Link, Route, Switch } from "wouter";
import { useSerene } from "@/contexts/SereneContext";

type Game = { id: string; title: string; description: string; category: string; image: string; dateAdded: string; tags: string[]; popularity: number; url: string; embedSource: string; developer: string; version: string };

async function loadGames() {
  const response = await fetch("/api/catalog/games");
  if (!response.ok) throw new Error("Could not load the game library.");
  return (await response.json() as { games: Game[] }).games;
}
function GameCard({ game }: { game: Game }) {
  const { favorites, toggleFavorite, markPlayed } = useSerene();
  const isFavorite = favorites.includes(game.id);
  return <article className="game-card"><div className="game-art" style={{ backgroundImage: `linear-gradient(180deg, rgba(7,8,10,.05), rgba(7,8,10,.86)), url(${game.image})` }}><button className={`favorite-button ${isFavorite ? "is-favorite" : ""}`} aria-label={isFavorite ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`} onClick={() => toggleFavorite(game.id)}><Heart size={15} fill={isFavorite ? "currentColor" : "none"} /></button><div className="game-card-overlay"><span className="micro-tag">{game.category}</span><h3>{game.title}</h3><p>{game.description}</p><Link href={`/games/${game.id}`} className="game-play-link" onClick={() => markPlayed(game.id)}>Play <ArrowUpRight size={14} /></Link></div></div><div className="game-card-foot"><span>{game.developer}</span><span>{game.version}</span></div></article>;
}
function GameDetail({ games, id }: { games: Game[]; id: string }) {
  const game = games.find((item) => item.id === id);
  const { favorites, toggleFavorite, markPlayed } = useSerene();
  const [started, setStarted] = useState(false);
  if (!game) return <div className="game-detail page-enter"><Link href="/games" className="back-link"><ArrowLeft size={15} /> Back to library</Link><div className="studio-empty">That game is no longer available.</div></div>;
  const favorite = favorites.includes(game.id);
  return <div className="game-detail page-enter"><Link href="/games" className="back-link"><ArrowLeft size={15} /> Back to library</Link><div className="game-detail-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(7,8,10,.96) 0%, rgba(7,8,10,.62) 56%, rgba(7,8,10,.12) 100%), url(${game.image})` }}><div className="game-detail-copy"><span className="eyebrow">{game.category} · {game.developer}</span><h1>{game.title}</h1><p>{game.description}</p><div className="detail-actions"><button className="primary-button" onClick={() => { setStarted(true); markPlayed(game.id); }}><Play size={15} fill="currentColor" /> {started ? "Playing now" : "Launch game"}</button><button className={`secondary-button ${favorite ? "is-favorite" : ""}`} onClick={() => toggleFavorite(game.id)}><Heart size={15} fill={favorite ? "currentColor" : "none"} /> {favorite ? "Saved" : "Save"}</button></div></div></div>{started && <div className="player-shell"><div className="player-topline"><span><span className="presence-dot" /> Session active</span><button className="text-button" onClick={() => setStarted(false)}>Close player <X size={14} /></button></div><div className="player-viewport">{game.url ? <iframe title={game.title} src={game.embedSource || game.url} allow="fullscreen" /> : <><Sparkles size={30} /><strong>{game.title}</strong><span>This game has no playable URL yet.</span></>}</div></div>}</div>;
}
function Library({ games }: { games: Game[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Featured");
  const { favorites } = useSerene();
  const categories = ["All", ...Array.from(new Set(games.map((game) => game.category)))];
  const filtered = useMemo(() => games.filter((game) => (category === "All" || game.category === category) && (`${game.title} ${game.description} ${game.category}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => sort === "Newest" ? b.dateAdded.localeCompare(a.dateAdded) : sort === "Popular" ? b.popularity - a.popularity : Number(b.tags.includes("featured")) - Number(a.tags.includes("featured"))), [category, games, query, sort]);
  return <div className="games-page page-enter"><div className="page-title-row"><div><span className="eyebrow">The quiet arcade</span><h1>Games with room to play.</h1><p>A library of thoughtful distractions, stored in the Serene catalog.</p></div><div className="page-title-mark"><span>{games.length.toString().padStart(2, "0")}</span><Sparkles size={19} /></div></div><div className="library-toolbar"><label className="field-with-icon"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search games" aria-label="Search games" />{query && <button onClick={() => setQuery("")} aria-label="Clear game search"><X size={14} /></button>}</label><div className="toolbar-group"><SlidersHorizontal size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort games"><option>Featured</option><option>Popular</option><option>Newest</option></select></div></div><div className="filter-row"><Filter size={14} />{categories.map((item) => <button key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}<span className="filter-count">{filtered.length} titles</span></div>{filtered.length ? <div className="game-grid">{filtered.map((game) => <GameCard key={game.id} game={game} />)}</div> : <div className="studio-empty">No games match this view.</div>}<div className="library-footer"><span><Heart size={14} /> {favorites.length} saved for later</span><span>New titles arrive quietly.</span></div></div>;
}
export default function Games() { const [games, setGames] = useState<Game[]>([]); const [error, setError] = useState(""); useEffect(() => { void loadGames().then(setGames).catch((err: Error) => setError(err.message)); }, []); return <Switch><Route path="/games/:id">{(params) => <GameDetail games={games} id={params.id} />}</Route><Route>{error ? <div className="studio-empty">{error}</div> : games.length ? <Library games={games} /> : <div className="profile-loading">loading game library…</div>}</Route></Switch>; }
