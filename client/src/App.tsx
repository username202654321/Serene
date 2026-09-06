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
import SearchPage from "@/pages/Search";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Chat from "@/pages/Chat";
import Studio from "@/pages/Studio";
import Shop from "@/pages/Shop";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import { AuthProvider } from "@/contexts/AuthContext";

function Router() {
  return <AppShell><Switch><Route path="/" component={Home} /><Route path="/games/:id?" component={Games} /><Route path="/browser" component={Browser} /><Route path="/search" component={SearchPage} /><Route path="/chat" component={Chat} /><Route path="/studio" component={Studio} /><Route path="/shop" component={Shop} /><Route path="/profile" component={Profile} /><Route path="/login" component={Auth} /><Route path="/settings" component={Settings} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></AppShell>;
}

export default function App() {
  return <ErrorBoundary><AuthProvider><SereneProvider><TooltipProvider><SereneBackground /><Toaster theme="dark" /><Router /></TooltipProvider></SereneProvider></AuthProvider></ErrorBoundary>;
}
