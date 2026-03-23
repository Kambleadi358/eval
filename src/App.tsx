import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCompetition from "./pages/AdminCompetition";
import AdminJudges from "./pages/AdminJudges";
import AdminEntries from "./pages/AdminEntries";
import AdminSettings from "./pages/AdminSettings";
import AdminReports from "./pages/AdminReports";
import JudgeLogin from "./pages/JudgeLogin";
import JudgePanel from "./pages/JudgePanel";
import PublicCompetition from "./pages/PublicCompetition";
import PublicReport from "./pages/PublicReport";
import Competitions from "./pages/Competitions";
import Results from "./pages/Results";

const queryClient = new QueryClient();

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">लोड होत आहे...</div>;
  if (!isAdmin) return <Navigate to="/admin-login" />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/competition" element={<AdminRoute><AdminCompetition /></AdminRoute>} />
            <Route path="/admin/judges" element={<AdminRoute><AdminJudges /></AdminRoute>} />
            <Route path="/admin/entries" element={<AdminRoute><AdminEntries /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
            <Route path="/report" element={<PublicReport />} />
            <Route path="/judge-login" element={<JudgeLogin />} />
            <Route path="/judge-panel/:competitionId" element={<JudgePanel />} />
            <Route path="/competitions" element={<Competitions />} />
            <Route path="/competition/:id" element={<PublicCompetition />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
