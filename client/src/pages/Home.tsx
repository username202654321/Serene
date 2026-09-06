import { ArrowUpRight, Gamepad2, Globe2, Play, Search } from "lucide-react";
import { Link } from "wouter";
import { games } from "@/lib/data";
import { useSerene } from "@/contexts/SereneContext";

export default function Home() {
  const { recentGames, markPlayed } = useSerene();
  const featured = games[0];
  const quickGames = games.slice(1, 4);
  const recent = recentGames.map((id) => games.find((game) => game.id === id)).filter(Boolean).slice(0, 3);

  return <div className="home-page serene-home page-enter">
    <section className="serene-hero">
      <div className="serene-hero-center">
        <span className="home-eyebrow">A quiet digital room</span>
        <h1>Serene</h1>
        <p>Games, browsing, and useful things with room to breathe.</p>
        <Link href="/search" className="serene-search"><Search size={17} /><span>Search anything</span><kbd>Ctrl K</kbd></Link>
      </div>

      <div className="serene-hero-links">
        <Link href="/games"><Gamepad2 size={15} /> Games</Link>
        <Link href="/browser"><Globe2 size={15} /> Browser</Link>
        <Link href={`/games/${featured.id}`} onClick={() => markPlayed(featured.id)}><Play size={14} fill="currentColor" /> Play</Link>
      </div>
    </section>

    <section className="serene-bottom-grid" aria-label="Serene quick access">
      <div className="serene-feature-card">
        <span className="eyebrow">Featured</span>
        <div className="serene-feature-preview" style={{ backgroundImage: `url(${featured.image})` }} />
        <div className="serene-feature-copy">
          <strong>{featured.title}</strong>
          <p>{featured.category}</p>
          <Link href={`/games/${featured.id}`} onClick={() => markPlayed(featured.id)} className="serene-play-link"><span>Open</span><ArrowUpRight size={14} /></Link>
        </div>
      </div>

      <div className="serene-mini-panel">
        <div className="mini-panel-head"><span className="eyebrow">Quick access</span></div>
        <div className="mini-game-list">
          {quickGames.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`} className="mini-game-row" onClick={() => markPlayed(game.id)}>
              <span className="mini-game-badge"><Play size={11} fill="currentColor" /></span>
              <span>
                <strong>{game.title}</strong>
                <small>{game.category}</small>
              </span>
            </Link>
          ))}
        </div>

        <div className="mini-panel-head recent-head"><span className="eyebrow">Recent</span></div>
        <div className="mini-recent-list">
          {recent.length ? recent.map((game) => game && <Link key={game.id} href={`/games/${game.id}`} className="mini-recent-item"><span>{game.title}</span><ArrowUpRight size={13} /></Link>) : <span className="serene-empty">Start anywhere.</span>}
        </div>
      </div>
    </section>
  </div>;
}
