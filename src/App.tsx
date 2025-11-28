import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
          <Route path="/reports" element={<Reports />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/install" element={<Install />} />
          <Route path="/manual" element={<Manual />} />
          <Route path="/manual-staff" element={<ManualStaff />} />
          <Route path="/manual-admin" element={<ManualAdmin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
