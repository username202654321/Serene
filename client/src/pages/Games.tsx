import { useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Filter, Heart, Play, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Link, Route, Switch, useLocation } from "wouter";
import { games, type Game } from "@/lib/data";
import { useSerene } from "@/contexts/SereneContext";

function GameCard({ game }: { game: Game }) {
  const { favorites, toggleFavorite, markPlayed } = useSerene();
  const isFavorite = favorites.includes(game.id);
  return <article className="game-card"><div className="game-art" style={{ backgroundImage: `linear-gradient(180deg, rgba(7,8,10,.05), rgba(7,8,10,.86)), url(${game.image})` }}><button className={`favorite-button ${isFavorite ? "is-favorite" : ""}`} aria-label={isFavorite ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`} onClick={() => toggleFavorite(game.id)}><Heart size={15} fill={isFavorite ? "currentColor" : "none"} /></button><div className="game-card-overlay"><span className="micro-tag">{game.category}</span><h3>{game.title}</h3><p>{game.description}</p><Link href={`/games/${game.id}`} className="game-play-link" onClick={() => markPlayed(game.id)}>Play <ArrowUpRight size={14} /></Link></div></div><div className="game-card-foot"><span>{game.popularity}° quietly popular</span><span>{game.dateAdded.slice(5).replace("-", ".")}</span></div></article>;
}

function GameDetail({ id }: { id: string }) {
  const game = games.find((item) => item.id === id) ?? games[0];
  const { favorites, toggleFavorite, markPlayed } = useSerene();
  const [started, setStarted] = useState(false);
  const favorite = favorites.includes(game.id);
  return <div className="game-detail page-enter"><Link href="/games" className="back-link"><ArrowLeft size={15} /> Back to library</Link><div className="game-detail-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(7,8,10,.96) 0%, rgba(7,8,10,.62) 56%, rgba(7,8,10,.12) 100%), url(${game.image})` }}><div className="game-detail-copy"><span className="eyebrow">{game.category} · {game.dateAdded.slice(0, 4)}</span><h1>{game.title}</h1><p>{game.description} Find a small pocket of time and let the room go quiet.</p><div className="detail-actions"><button className="primary-button" onClick={() => { setStarted(true); markPlayed(game.id); }}><Play size={15} fill="currentColor" /> {started ? "Playing now" : "Launch game"}</button><button className={`secondary-button ${favorite ? "is-favorite" : ""}`} onClick={() => toggleFavorite(game.id)}><Heart size={15} fill={favorite ? "currentColor" : "none"} /> {favorite ? "Saved" : "Save"}</button></div></div><div className="detail-index">{game.id.slice(0, 2).toUpperCase()}<span /> PLAY / {game.category.toUpperCase()}</div></div>{started && <div className="player-shell"><div className="player-topline"><span><span className="presence-dot" /> Session active</span><button className="text-button" onClick={() => setStarted(false)}>Close player <X size={14} /></button></div><div className="player-viewport"><Sparkles size={30} /><strong>{game.title}</strong><span>The dedicated game viewport is ready for this session.</span><button className="primary-button small" onClick={() => setStarted(false)}>Pause and return</button></div></div>}</div>;
}

function Library() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Featured");
  const { favorites } = useSerene();
  const categories = ["All", ...Array.from(new Set(games.map((game) => game.category)))];
  const filtered = useMemo(() => games.filter((game) => (category === "All" || game.category === category) && (`${game.title} ${game.description} ${game.category}`).toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "Newest" ? b.dateAdded.localeCompare(a.dateAdded) : sort === "Popular" ? b.popularity - a.popularity : Number(Boolean(b.featured)) - Number(Boolean(a.featured))), [category, query, sort]);
  return <div className="games-page page-enter"><div className="page-title-row"><div><span className="eyebrow">The quiet arcade</span><h1>Games with room to play.</h1><p>A small library of thoughtful distractions, from quick reflexes to slower puzzles.</p></div><div className="page-title-mark"><span>06</span><Sparkles size={19} /></div></div><div className="library-toolbar"><label className="field-with-icon"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search games" aria-label="Search games" />{query && <button onClick={() => setQuery("")} aria-label="Clear game search"><X size={14} /></button>}</label><div className="toolbar-group"><SlidersHorizontal size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort games"><option>Featured</option><option>Popular</option><option>Newest</option></select></div></div><div className="filter-row"><Filter size={14} />{categories.map((item) => <button key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}<span className="filter-count">{filtered.length} titles</span></div><div className="game-grid">{filtered.map((game) => <GameCard key={game.id} game={game} />)}</div><div className="library-footer"><span><Heart size={14} /> {favorites.length} saved for later</span><span>New titles arrive quietly.</span></div></div>;
}

export default function Games() { return <Switch><Route path="/games/:id">{(params) => <GameDetail id={params.id} />}</Route><Route><Library /></Route></Switch>; }
