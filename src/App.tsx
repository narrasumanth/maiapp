import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { useDailyLoginBonus } from "@/hooks/useDailyLoginBonus";

// Eager load Index for fast initial render
import Index from "./pages/Index";

// Lazy load all other pages for faster initial bundle
const ResultPage = lazy(() => import("./pages/ResultPage"));
const ImpulsePage = lazy(() => import("./pages/ImpulsePage"));
const FlexPage = lazy(() => import("./pages/FlexPage"));
const FeedPage = lazy(() => import("./pages/FeedPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PrivateViewPage = lazy(() => import("./pages/PrivateViewPage"));
const ApiKeysPage = lazy(() => import("./pages/ApiKeysPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminMessagesPage = lazy(() => import("./pages/AdminMessagesPage"));
const DisputesPage = lazy(() => import("./pages/DisputesPage"));
const AdminDisputesPage = lazy(() => import("./pages/AdminDisputesPage"));
const JoinEventPage = lazy(() => import("./pages/JoinEventPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LookupPage = lazy(() => import("./pages/LookupPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Minimal loading spinner for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Global error boundary component
const AppContent = () => {
  // Daily login bonus hook
  useDailyLoginBonus();

  // Global unhandled rejection handler
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      toast.error("Something went wrong. Please try again.");
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/impulse" element={<ImpulsePage />} />
          <Route path="/roulette" element={<ImpulsePage />} />
          <Route path="/join/:code" element={<JoinEventPage />} />
          <Route path="/join" element={<JoinEventPage />} />
          <Route path="/flex" element={<FlexPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/view/:token" element={<PrivateViewPage />} />
          <Route path="/lookup/:code" element={<LookupPage />} />
          <Route path="/api-keys" element={<ApiKeysPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/messages" element={<AdminMessagesPage />} />
          <Route path="/admin/claim-disputes" element={<AdminDisputesPage />} />
          <Route path="/disputes" element={<DisputesPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </div>
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
