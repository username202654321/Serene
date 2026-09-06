import { ArrowUpRight, Gamepad2, Globe2, Play, Search } from "lucide-react";
import { Link } from "wouter";
import { games } from "@/lib/data";
import { useSerene } from "@/contexts/SereneContext";

export default function Home() {
  const { recentGames, markPlayed } = useSerene();
  const featured = games[0];
  const quickGames = games.slice(1, 4);
  const recent = recentGames.map((id) => games.find((game) => game.id === id)).filter(Boolean).slice(0, 2);
  return <div className="home-page serene-home page-enter">
    <section className="serene-hero">
      <div className="serene-hero-center"><span className="home-eyebrow">A quiet digital room</span><h1>Serene</h1><p>Games, browsing, and useful things with room to breathe.</p><Link href="/search" className="serene-search"><Search size={17} /><span>Search anything</span><kbd>Ctrl K</kbd></Link></div>
      <div className="serene-hero-links"><Link href="/games"><Gamepad2 size={15} /> Games</Link><Link href="/browser"><Globe2 size={15} /> Browser</Link><Link href={`/games/${featured.id}`} onClick={() => markPlayed(featured.id)}><Play size={14} fill="currentColor" /> Play</Link></div>
    </section>
    <section className="home-dock" aria-label="Serene quick access"><Link href={`/games/${featured.id}`} className="home-dock-feature" onClick={() => markPlayed(featured.id)}><img src={featured.image} alt="" /><span><small>Featured</small><strong>{featured.title}</strong></span><ArrowUpRight size={15} /></Link><div className="home-dock-games">{quickGames.map((game) => <Link key={game.id} href={`/games/${game.id}`} onClick={() => markPlayed(game.id)}><span className="dock-game-mark"><Play size={11} fill="currentColor" /></span><span><strong>{game.title}</strong><small>{game.category}</small></span></Link>)}</div><div className="home-dock-recent"><small>Recent</small>{recent.length ? recent.map((game) => game && <Link key={game.id} href={`/games/${game.id}`}>{game.title}<ArrowUpRight size={12} /></Link>) : <span>Start anywhere.</span>}</div></section>
  </div>;
}
