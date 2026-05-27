import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { AuthProvider, useAuth } from "@/lib/auth";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Messages from "@/pages/Messages";
import Create from "@/pages/Create";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Dua from "@/pages/Dua";
import Memories from "@/pages/Memories";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/chat" component={Messages} />
        <Route path="/create" component={Create} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile/wife" component={Profile} />
        <Route path="/dua" component={Dua} />
        <Route path="/memories" component={Memories} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ProtectedRouter />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
