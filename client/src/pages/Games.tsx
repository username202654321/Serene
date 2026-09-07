import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, ExternalLink, Filter, Heart, Play, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Link, Route, Switch } from "wouter";
import { useSerene } from "@/contexts/SereneContext";

type Game = { id: string; title: string; description: string; category: string; image: string; dateAdded: string; tags: string[]; popularity: number; url: string; embedSource: string; sourceFile?: string; developer: string; version: string };

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
  const [loadingGame, setLoadingGame] = useState(false);
  const [gameLoadError, setGameLoadError] = useState(false);
  useEffect(() => {
    if (!started) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setStarted(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [started]);
  if (!game) return <div className="game-detail page-enter"><Link href="/games" className="back-link"><ArrowLeft size={15} /> Back to library</Link><div className="studio-empty">That game is no longer available.</div></div>;
  const favorite = favorites.includes(game.id);
  const gameUrl = game.embedSource || game.url;
  const sourceUrl = game.url || game.embedSource;
  let sourceLabel = "Source not configured";
  if (sourceUrl) {
    try { sourceLabel = new URL(sourceUrl).hostname; } catch { sourceLabel = "Configured game source"; }
  }
  const launchGame = () => { setGameLoadError(false); setStarted(true); setLoadingGame(Boolean(gameUrl)); markPlayed(game.id); };
  const closePlayer = () => { setStarted(false); setLoadingGame(false); setGameLoadError(false); };
  const closeOnFrameEscape = (event: KeyboardEvent) => { if (event.key === "Escape") closePlayer(); };
  return <div className="game-detail page-enter"><Link href="/games" className="back-link"><ArrowLeft size={15} /> Back to library</Link><div className="game-detail-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(7,8,10,.96) 0%, rgba(7,8,10,.62) 56%, rgba(7,8,10,.12) 100%), url(${game.image})` }}><div className="game-detail-copy"><span className="eyebrow">{game.category} · {game.developer}</span><h1>{game.title}</h1><p>{game.description}</p><div className="detail-actions"><button className="primary-button" onClick={launchGame}><Play size={15} fill="currentColor" /> {started ? "Playing now" : "Launch game"}</button><button className={`secondary-button ${favorite ? "is-favorite" : ""}`} onClick={() => toggleFavorite(game.id)}><Heart size={15} fill={favorite ? "currentColor" : "none"} /> {favorite ? "Saved" : "Save"}</button></div></div></div><section className="game-about"><div><span className="eyebrow">About this game</span><p>{game.description}</p></div><dl><div><dt>Category</dt><dd>{game.category}</dd></div><div><dt>Developer</dt><dd>{game.developer}</dd></div><div><dt>Version</dt><dd>{game.version}</dd></div><div><dt>Source</dt><dd>{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer">{sourceLabel} <ExternalLink size={11} /></a> : sourceLabel}</dd></div></dl></section>{started && <div className="game-player-modal" role="dialog" aria-modal="true" aria-label={`${game.title} player`}><div className="player-shell"><div className="player-topline"><span><span className="presence-dot" /> {loadingGame ? "Preparing game" : "Session active"}</span><button className="text-button" onClick={closePlayer}>Close player <X size={14} /></button></div><div className="player-viewport">{gameUrl ? gameLoadError ? <><Sparkles size={30} /><strong>Unable to open {game.title}</strong><span>The configured game source did not load. Check its URL in Studio.</span></> : <>{loadingGame && <div className="player-loading"><Sparkles size={24} /><strong>Opening {game.title}</strong><span>Preparing the game experience…</span></div>}<iframe title={game.title} src={gameUrl} allow="autoplay; fullscreen; gamepad" allowFullScreen onLoad={(event) => { setLoadingGame(false); window.focus(); try { event.currentTarget.contentWindow?.addEventListener("keydown", closeOnFrameEscape); } catch {} }} onError={() => { setLoadingGame(false); setGameLoadError(true); }} /></> : <><Sparkles size={30} /><strong>{game.title}</strong><span>This game is not playable yet because Studio has not configured a game URL.</span></>}</div></div></div>}</div>;
}
function Library({ games }: { games: Game[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Featured");
  const { favorites, markPlayed } = useSerene();
  const categories = ["All", ...Array.from(new Set(games.map((game) => game.category)))];
  const filtered = useMemo(() => games.filter((game) => (category === "All" || game.category === category) && (`${game.title} ${game.description} ${game.category}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => sort === "Newest" ? b.dateAdded.localeCompare(a.dateAdded) : sort === "Popular" ? b.popularity - a.popularity : Number(b.tags.includes("featured")) - Number(a.tags.includes("featured"))), [category, games, query, sort]);
  const featured = filtered[0];
  return <div className="games-page page-enter"><div className="page-title-row"><div><span className="eyebrow">The quiet arcade</span><h1>Games</h1><p>A considered library of small worlds and welcome distractions.</p></div><div className="page-title-mark"><span>{games.length.toString().padStart(2, "0")}</span><Sparkles size={19} /></div></div><div className="library-toolbar"><label className="field-with-icon"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search games" aria-label="Search games" />{query && <button onClick={() => setQuery("")} aria-label="Clear game search"><X size={14} /></button>}</label><div className="toolbar-group"><SlidersHorizontal size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort games"><option>Featured</option><option>Popular</option><option>Newest</option></select></div></div><div className="filter-row"><Filter size={14} />{categories.map((item) => <button key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}<span className="filter-count">{filtered.length} titles</span></div>{featured ? <><article className="library-feature" style={{ backgroundImage: `linear-gradient(90deg, rgba(6,7,9,.96) 2%, rgba(6,7,9,.55) 52%, rgba(6,7,9,.12)), url(${featured.image})` }}><div><span className="eyebrow">Featured · {featured.category}</span><h2>{featured.title}</h2><p>{featured.description}</p><Link href={`/games/${featured.id}`} className="primary-button small" onClick={() => markPlayed(featured.id)}><Play size={14} fill="currentColor" /> Play now</Link></div></article><div className="library-section-head"><span>Explore the library</span><small>{favorites.length} favorites saved</small></div><div className="game-grid">{filtered.slice(1).map((game) => <GameCard key={game.id} game={game} />)}</div></> : <div className="studio-empty">No games match this view.</div>}<div className="library-footer"><span><Heart size={14} /> {favorites.length} saved for later</span><span>New titles arrive quietly.</span></div></div>;
}
export default function Games() { const [games, setGames] = useState<Game[]>([]); const [error, setError] = useState(""); useEffect(() => { void loadGames().then(setGames).catch((err: Error) => setError(err.message)); }, []); return <Switch><Route path="/games/:id">{(params) => <GameDetail games={games} id={params.id} />}</Route><Route>{error ? <div className="studio-empty">{error}</div> : games.length ? <Library games={games} /> : <div className="profile-loading">loading game library…</div>}</Route></Switch>; }
