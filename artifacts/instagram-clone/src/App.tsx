import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/Toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/lib/auth";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import { lazy, Suspense, type ReactNode } from "react";

const Messages = lazy(() => import("@/pages/Messages"));
import Create from "@/pages/Create";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Notifications from "@/pages/Notifications";
import Dua from "@/pages/Dua";
import Memories from "@/pages/Memories";
import Calendar from "@/pages/Calendar";
import DailyCheckin from "@/pages/DailyCheckin";
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
  const { user, authReady } = useAuth();

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
            <Suspense
              fallback={
                <div
                  className="flex min-h-[100dvh] items-center justify-center"
                  style={{ background: "#141210", color: "#e8e0d5" }}
                >
                  Loading chat…
                </div>
              }
            >
              <Messages />
            </Suspense>
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
        <Route path="/checkin">
          <PageWrapper><DailyCheckin /></PageWrapper>
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
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={(import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") || ""}>
              <ProtectedRouter />
            </WouterRouter>
            <Toaster />
            <SonnerToaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
