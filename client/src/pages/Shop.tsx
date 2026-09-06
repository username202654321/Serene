import { useMemo, useState } from "react";
import { Check, Crown, Disc3, Gem, Sparkles, Star, WandSparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProfileOrb from "@/components/ProfileOrb";

const shopItems = [
  { id: "theme-hydrochrome", name: "Rainbow Hydrochrome", type: "Theme", price: 450, icon: Gem, description: "A liquid rainbow glass theme for the whole Serene UI." },
  { id: "theme-pastel", name: "Pastel Dream", type: "Theme", price: 300, icon: Sparkles, description: "Soft pastel gradients with a bright, airy surface." },
  { id: "theme-midnight", name: "Midnight Bloom", type: "Theme", price: 250, icon: Crown, description: "Deep violet-black surfaces with slow bloom lighting." },
  { id: "particle-spark", name: "Spark Particles", type: "Particles", price: 180, icon: WandSparkles, description: "Tiny glowing sparks drift around the background." },
  { id: "particle-orbit", name: "Orbit Particles", type: "Particles", price: 240, icon: Disc3, description: "Soft orbiting motes that react to your pointer." },
  { id: "avatar-spin", name: "Holo Spin", type: "Avatar animation", price: 220, icon: Disc3, description: "A subtle rotating holographic PFP treatment." },
  { id: "frame-orbit", name: "Orbit Frame", type: "Profile frame", price: 200, icon: Crown, description: "Two animated rings around your 3D profile orb." },
];

export default function Shop() {
  const { user, buyItem } = useAuth();
  const [filter, setFilter] = useState("All");
  const [busy, setBusy] = useState("");
  const filters = ["All", "Theme", "Particles", "Avatar animation", "Profile frame"];
  const visible = useMemo(() => filter === "All" ? shopItems : shopItems.filter((item) => item.type === filter), [filter]);
  if (!user) return <div className="shop-page page-enter"><div className="shop-login-note">sign in to spend Stars in the Serene Shop.</div></div>;
  const purchase = async (id: string) => { setBusy(id); try { await buyItem(id); } catch (error) { alert(error instanceof Error ? error.message : "Purchase failed."); } finally { setBusy(""); } };
  return <div className="shop-page page-enter"><div className="shop-head"><div><span className="eyebrow">Serene Shop</span><h1>make the whole space yours.</h1><p>themes, particles, profile effects, and animated identity items powered by Stars.</p></div><div className="shop-wallet"><Star size={17} /><strong>{user.stars.toLocaleString()}</strong><span>Stars</span></div></div><div className="shop-profile-strip"><ProfileOrb username={user.username} animation={user.avatarAnimation} frame={user.avatarFrame} size="sm" /><div><strong>@{user.username}</strong><span>{user.ownedItems.length} owned items</span></div><div className="shop-profile-effects"><span>{user.siteTheme}</span><span>{user.particles}</span><span>{user.avatarAnimation}</span></div></div><div className="shop-filters">{filters.map((item) => <button key={item} className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="shop-grid">{visible.map((item) => { const Icon = item.icon; const owned = user.ownedItems.includes(item.id); return <article className={`shop-item ${owned ? "is-owned" : ""}`} key={item.id}><div className="shop-item-art"><Icon size={25} /><div className="shop-item-orbit" /></div><div className="shop-item-copy"><span>{item.type}</span><h2>{item.name}</h2><p>{item.description}</p></div><div className="shop-item-buy">{owned ? <button className="secondary-button small" disabled><Check size={14} /> Owned</button> : <button className="primary-button small" disabled={busy === item.id || user.stars < item.price} onClick={() => purchase(item.id)}><Star size={13} /> {busy === item.id ? "Buying…" : item.price}</button>}</div></article>; })}</div></div>;
}
