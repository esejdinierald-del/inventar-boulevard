import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DailyEntry from "./pages/DailyEntry";
import DailyEntryTurn1 from "./pages/DailyEntryTurn1";
import DailyEntryTurn2 from "./pages/DailyEntryTurn2";
import Reports from "./pages/Reports";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/daily" element={<DailyEntry />} />
          <Route path="/daily/turn1" element={<DailyEntryTurn1 />} />
          <Route path="/daily/turn2" element={<DailyEntryTurn2 />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/install" element={<Install />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
