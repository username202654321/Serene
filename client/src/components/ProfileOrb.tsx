import { useState, type CSSProperties, type PointerEvent } from "react";

type ProfileOrbProps = { username: string; seed?: string; animation?: string; frame?: string; size?: "sm" | "md" | "lg" };

export default function ProfileOrb({ username, seed = "serene", animation = "float", frame = "none", size = "md" }: ProfileOrbProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const initial = username.slice(0, 1).toUpperCase();
  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({ x: ((event.clientY - rect.top) / rect.height - 0.5) * -18, y: ((event.clientX - rect.left) / rect.width - 0.5) * 18 });
  };
  return <div className={`profile-orb-wrap size-${size} anim-${animation} frame-${frame}`} onPointerMove={handleMove} onPointerLeave={() => setTilt({ x: 0, y: 0 })} style={{ transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
    <div className="profile-orb" style={{ "--avatar-seed": `'${seed}'` } as CSSProperties}>
      <div className="profile-orb-shine" />
      <div className="profile-orb-core"><span>{initial}</span></div>
      <div className="profile-orb-ring ring-one" />
      <div className="profile-orb-ring ring-two" />
    </div>
  </div>;
}
