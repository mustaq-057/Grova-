import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/Toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth, PROFILE_INACTIVITY_MS } from "@/lib/auth";
import { CallProvider } from "@/lib/call-context";
import { AudioPlayerProvider } from "@/lib/audio-player-context";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import { toast } from "sonner";
import { useEffect, useRef, type ReactNode } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import Messages from "@/pages/Messages";
import Create from "@/pages/Create";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Notifications from "@/pages/Notifications";
import Dua from "@/pages/Dua";
import Memories from "@/pages/Memories";
import Calendar from "@/pages/Calendar";
import Library from "@/pages/Library";
import EReader from "@/pages/EReader";
import Tasks from "@/pages/Tasks";
import Milestones from "@/pages/Milestones";
import SecretNotes from "@/pages/SecretNotes";
import NotFound from "@/pages/not-found";
const queryClient = new QueryClient();

function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full min-h-0">
      {children}
    </div>
  );
}

function AuthLoading() {
  return (
    <div
      className="flex min-h-[100dvh] w-full items-center justify-center"
      style={{ background: "#141210", color: "#e8e0d5" }}
    >
      <p className="text-sm" style={{ color: "#c9bfb0" }}>
        Loading Grova…
      </p>
    </div>
  );
}

function ProtectedRouter() {
  const { user, authReady, lockProfileSession } = useAuth();
  const lastActivityRef = useRef(Date.now());
  
  // Register for push notifications if on Android/iOS
  usePushNotifications();

  useEffect(() => {
    if (!user) return;
    lastActivityRef.current = Date.now();
    const mark = () => {
      lastActivityRef.current = Date.now();
    };
    const events: Array<keyof WindowEventMap> = ["mousemove", "keydown", "click", "touchstart", "focus"];
    events.forEach((evt) => window.addEventListener(evt, mark, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > PROFILE_INACTIVITY_MS) {
        lockProfileSession();
      }
    }, 60_000);
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, mark));
      window.clearInterval(timer);
    };
  }, [user, lockProfileSession]);

  if (!authReady) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/">
          <PageWrapper><Home /></PageWrapper>
        </Route>
        <Route path="/chat">
          <PageWrapper>
            <Messages />
          </PageWrapper>
        </Route>
        <Route path="/create">
          <PageWrapper><Create /></PageWrapper>
        </Route>
        <Route path="/profile">
          <PageWrapper><Profile /></PageWrapper>
        </Route>
        <Route path="/profile/wife">
          <Redirect to="/profile" />
        </Route>
        <Route path="/notifications">
          <PageWrapper><Notifications /></PageWrapper>
        </Route>
        <Route path="/dua">
          <PageWrapper><Dua /></PageWrapper>
        </Route>
        <Route path="/memories">
          <PageWrapper><Memories /></PageWrapper>
        </Route>
        <Route path="/calendar">
          <PageWrapper><Calendar /></PageWrapper>
        </Route>
        <Route path="/library">
          <PageWrapper><Library /></PageWrapper>
        </Route>
        <Route path="/read/:id">
          <PageWrapper><EReader /></PageWrapper>
        </Route>
        <Route path="/tasks">
          <PageWrapper><Tasks /></PageWrapper>
        </Route>
        <Route path="/milestones">
          <PageWrapper><Milestones /></PageWrapper>
        </Route>
        <Route path="/secret-notes">
          <PageWrapper><SecretNotes /></PageWrapper>
        </Route>
        <Route path="/settings">
          <PageWrapper><Settings /></PageWrapper>
        </Route>
        <Route>
          <PageWrapper><NotFound /></PageWrapper>
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  // Override native alert globally to use our beautiful toast system
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      // Don't show empty alerts
      if (!message) return;
      toast(message, { 
        duration: 4000, 
        position: 'top-center' 
      });
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CallProvider>
              <AudioPlayerProvider>
                <WouterRouter base={(import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") || ""}>
                  <ProtectedRouter />
                </WouterRouter>
              </AudioPlayerProvider>
            </CallProvider>
            <Toaster />
            <SonnerToaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
