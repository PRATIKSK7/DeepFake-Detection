import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import LandingPage from "@/pages/LandingPage";
import UploadPage from "@/pages/UploadPage";
import DashboardPage from "@/pages/DashboardPage";
import HistoryPage from "@/pages/HistoryPage";
import ModelsPage from "@/pages/ModelsPage";
import DetectionDetailPage from "@/pages/DetectionDetailPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/analyze">
        <Layout><UploadPage /></Layout>
      </Route>
      <Route path="/dashboard">
        <Layout><DashboardPage /></Layout>
      </Route>
      <Route path="/history">
        <Layout><HistoryPage /></Layout>
      </Route>
      <Route path="/models">
        <Layout><ModelsPage /></Layout>
      </Route>
      <Route path="/detection/:id">
        {(params) => <Layout><DetectionDetailPage /></Layout>}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
