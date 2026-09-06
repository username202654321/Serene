import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSerene } from "@/contexts/SereneContext";

export default function SereneBackground() {
  const { appearance, theme } = useSerene();
  const { user } = useAuth();
  const particleStyle = user?.particles || "dust";
  const particles = useMemo(() => Array.from({ length: particleStyle === "orbit" ? 22 : particleStyle === "spark" ? 28 : 14 }, (_, index) => ({ id: index, left: `${(index * 37) % 101}%`, top: `${(index * 61) % 103}%`, delay: `${(index % 9) * -0.8}s`, size: `${3 + (index % 4)}px` })), [particleStyle]);
  return <div className={`serene-background particle-${particleStyle} theme-bg-${theme}`} aria-hidden="true">
    <div className="serene-light serene-light-one" />
    <div className="serene-light serene-light-two" />
    <div className="serene-light serene-light-three" />
    <div className="serene-light serene-light-four" />
    <div className="pointer-light" />
    <div className="particle-field">{particles.map((particle) => <i key={particle.id} style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size, animationDelay: particle.delay }} />)}</div>
    <div className="serene-vignette" />
    <div className="grain-layer" style={{ opacity: appearance.grain / 100 }} />
  </div>;
}
