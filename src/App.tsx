import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DailyEntry from "./pages/DailyEntry";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";
import Install from "./pages/Install";
import Manual from "./pages/Manual";
import ManualStaff from "./pages/ManualStaff";
import ManualAdmin from "./pages/ManualAdmin";
import NotFound from "./pages/NotFound";
import { useAnonymousAuth } from "./hooks/useAnonymousAuth";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isLoading, isAuthenticated, error, retry } = useAnonymousAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Duke u lidhur...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Nuk u lidh dot</h1>
          <p className="text-sm text-muted-foreground">
            {error ? `Detaje: ${error}` : 'Provo përsëri. Nëse vazhdon, rifresko faqen.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={retry}>Riprovo</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Rifresko
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/daily" element={<DailyEntry />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/install" element={<Install />} />
      <Route path="/manual" element={<Manual />} />
      <Route path="/manual-staff" element={<ManualStaff />} />
      <Route path="/manual-admin" element={<ManualAdmin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
