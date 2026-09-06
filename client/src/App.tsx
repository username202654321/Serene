import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Route, Switch } from "wouter";
import AppShell from "@/components/AppShell";
import SereneBackground from "@/components/SereneBackground";
import { SereneProvider } from "@/contexts/SereneContext";
import Home from "@/pages/Home";
import Games from "@/pages/Games";
import Browser from "@/pages/Browser";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Chat from "@/pages/Chat";
import Studio from "@/pages/Studio";
import Shop from "@/pages/Shop";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

function Router() {
  return <AppShell><Switch><Route path="/" component={Home} /><Route path="/games/:id?" component={Games} /><Route path="/browser" component={Browser} /><Route path="/chat" component={Chat} /><Route path="/studio" component={Studio} /><Route path="/shop" component={Shop} /><Route path="/profile" component={Profile} /><Route path="/login" component={Auth} /><Route path="/settings" component={Settings} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></AppShell>;
}

function LaunchGate() {
  const { loading } = useAuth();
  const [visible, setVisible] = useState(true);
  useEffect(() => { if (!loading) { const timer = window.setTimeout(() => setVisible(false), 420); return () => window.clearTimeout(timer); } }, [loading]);
  return visible ? <div className={`launch-screen ${loading ? "" : "is-leaving"}`} aria-label="Loading Serene"><span>Serene</span><i><b /></i></div> : null;
}

export default function App() {
  return <ErrorBoundary><AuthProvider><SereneProvider><TooltipProvider><SereneBackground /><Toaster theme="dark" /><Router /><LaunchGate /></TooltipProvider></SereneProvider></AuthProvider></ErrorBoundary>;
}
