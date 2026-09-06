import { ArrowUpRight, Gamepad2, Globe2, Play, Search, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { games } from "@/lib/data";
import { useSerene } from "@/contexts/SereneContext";

export default function Home() {
  const { recentGames, markPlayed } = useSerene();
  const featured = games[0];
  const recent = recentGames.map((id) => games.find((game) => game.id === id)).filter(Boolean);
  const popular = games.slice(1, 5);

  return (
    <div className="home-page serene-home page-enter">
      <section className="serene-hero">
        <div className="serene-hero-center">
          <span className="serene-hero-mark" aria-hidden="true">✦</span>
          <h1>Serene</h1>
          <p>a quiet place for games, browsing, and useful things.</p>
          <Link href="/search" className="serene-search"><Search size={17} /><span>search anything</span><kbd>⌘ K</kbd></Link>
        </div>
        <div className="serene-hero-links">
          <Link href="/games"><Gamepad2 size={15} /> Games</Link>
          <Link href="/browser"><Globe2 size={15} /> Browser</Link>
          <Link href="/apps"><Sparkles size={15} /> Apps</Link>
        </div>
      </section>

      <section className="serene-section serene-feature-section">
        <div className="serene-section-head"><span>featured</span><Link href="/games">view all <ArrowUpRight size={13} /></Link></div>
        <Link href={`/games/${featured.id}`} className="serene-feature" onClick={() => markPlayed(featured.id)}>
          <img src={featured.image} alt="" />
          <div className="serene-feature-shade" />
          <div className="serene-feature-copy">
            <span>{featured.category}</span>
            <h2>{featured.title}</h2>
            <p>{featured.description}</p>
            <span className="serene-play"><Play size={13} fill="currentColor" /> play</span>
          </div>
        </Link>
      </section>

      <section className="serene-section serene-grid-section">
        <div className="serene-section-head"><span>games</span><Link href="/games">explore <ArrowUpRight size={13} /></Link></div>
        <div className="serene-game-grid">
          {popular.map((game) => (
            <Link href={`/games/${game.id}`} className="serene-game" key={game.id}>
              <div className="serene-game-image"><img src={game.image} alt="" /><span><Play size={12} fill="currentColor" /></span></div>
              <div className="serene-game-meta"><strong>{game.title}</strong><small>{game.category}</small></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="serene-section serene-bottom-grid">
        <div>
          <div className="serene-section-head"><span>recent</span><Link href="/games">library <ArrowUpRight size={13} /></Link></div>
          {recent.length ? <div className="serene-recent-list">{recent.slice(0, 4).map((game) => game && <Link href={`/games/${game.id}`} key={game.id}><span>{game.title}</span><small>{game.category}</small><ArrowUpRight size={13} /></Link>)}</div> : <div className="serene-empty">play a game and it will appear here.</div>}
        </div>
        <div className="serene-switch-card"><span>something else?</span><h3>browse the web or open a tool.</h3><div><Link href="/browser">browser <ArrowUpRight size={13} /></Link><Link href="/apps">apps <ArrowUpRight size={13} /></Link></div></div>
      </section>
    </div>
  );
}
