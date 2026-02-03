import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import Index from "./pages/Index";
import ResultPage from "./pages/ResultPage";
import RoulettePage from "./pages/RoulettePage";
import FeedPage from "./pages/FeedPage";
import DashboardPage from "./pages/DashboardPage";
import PrivateViewPage from "./pages/PrivateViewPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import DisputesPage from "./pages/DisputesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/roulette" element={<RoulettePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/view/:token" element={<PrivateViewPage />} />
          <Route path="/api-keys" element={<ApiKeysPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/disputes" element={<DisputesPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
