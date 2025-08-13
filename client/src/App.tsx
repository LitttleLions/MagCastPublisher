import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import JsonIngestion from "@/pages/json-ingestion";
import Templates from "@/pages/templates";
import RenderQueue from "@/pages/render-queue";
import Assets from "@/pages/assets";
import Publications from "@/pages/publications";
import LayoutEngine from "@/pages/layout-engine";
import MainLayout from "@/components/layout/main-layout";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/json-ingestion" component={JsonIngestion} />
        <Route path="/templates" component={Templates} />
        <Route path="/render-queue" component={RenderQueue} />
        <Route path="/assets" component={Assets} />
        <Route path="/publications" component={Publications} />
        <Route path="/layout-engine" component={LayoutEngine} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
