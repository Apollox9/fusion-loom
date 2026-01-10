import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import SchoolDashboard from "./pages/school/SchoolDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AuditorDashboard from "./pages/auditor/AuditorDashboard";
import AuditSessionPage from "./pages/auditor/AuditSessionPage";
import FeaturesPage from "./pages/FeaturesPage";
import DemoPage from "./pages/DemoPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import HelpSupport from "./pages/HelpSupport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/payment-methods" element={<PaymentMethodsPage />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/help" element={<HelpSupport />} />

            {/* School Portal */}
            <Route path="/school/*" element={
              <ProtectedRoute allowedRoles={['SCHOOL_USER']}>
                <SchoolDashboard />
              </ProtectedRoute>
            } />

            {/* Auditor Portal */}
            <Route path="/auditor" element={
              <ProtectedRoute allowedRoles={['AUDITOR', 'OPERATOR', 'SUPERVISOR', 'ADMIN']}>
                <AuditorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/auditor/audit/:auditId" element={
              <ProtectedRoute allowedRoles={['AUDITOR', 'OPERATOR', 'SUPERVISOR', 'ADMIN']}>
                <AuditSessionPage />
              </ProtectedRoute>
            } />

            {/* Admin Portal */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;