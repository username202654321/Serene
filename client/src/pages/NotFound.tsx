/* Luminous Quietude: even errors preserve the quiet room, offering a clear way back without exposing implementation detail. */
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Wordmark } from "@/components/LogoMark";

export default function NotFound() { return <div className="not-found page-enter"><Wordmark /><div className="not-found-mark"><Sparkles size={28} /></div><span className="eyebrow">A quiet wrong turn</span><h1>404</h1><p>That place is not here, but the room is still open.</p><Link href="/" className="primary-button"><ArrowLeft size={15} /> Back home</Link></div>; }
