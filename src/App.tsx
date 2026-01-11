import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardNew from "./pages/DashboardNew";
import Materials from "./pages/Materials";
import MaterialDetail from "./pages/MaterialDetail";
import CourseDetail from "./pages/CourseDetail";
import Agenda from "./pages/Agenda";
import FlashcardsPage from "./pages/FlashcardsPage";
import FlashcardStudy from "./pages/FlashcardStudy";
import SettingsPage from "./pages/SettingsPage";
import Progress from "./pages/Progress";
import Plan from "./pages/Plan";
import Learn from "./pages/Learn";
import SessionComplete from "./pages/SessionComplete";
import Goals from "./pages/Goals";
import Creativity from "./pages/Creativity";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<DashboardNew />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/creativity" element={<Creativity />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/material/:materialId" element={<MaterialDetail />} />
              <Route path="/course/:courseId" element={<CourseDetail />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/flashcards/:unitId" element={<FlashcardStudy />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/learn/:unitId" element={<Learn />} />
              <Route path="/session-complete/:unitId" element={<SessionComplete />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;