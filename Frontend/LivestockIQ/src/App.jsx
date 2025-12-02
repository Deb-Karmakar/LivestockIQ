import { Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import ReactGA from 'react-ga4';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SyncProvider } from "./contexts/SyncContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Toaster as HotToaster } from 'react-hot-toast';

// Core Component & Page Imports
import Navigation from "@/components/Navigation";
import LandingPage from "@/pages/LandingPage";
import LearnMore from './components/LearnMore';
import AuthPage from "./pages/AuthPage";
import { useAuth } from "./contexts/AuthContext";
import { ChatWidget } from "./components/ChatWidget";


// Farmer Page Imports
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/farmer/DashboardPage";
import AnimalsPage from "./pages/farmer/AnimalsPage";
import TreatmentsPage from "./pages/farmer/TreatmentsPage";
import SellPage from './pages/farmer/SellPage';
import InventoryPage from "./pages/farmer/InventoryPage";
import AlertsPage from "./pages/farmer/AlertsPage";
import ReportsPage from "./pages/farmer/ReportsPage";
import SettingsPage from "./pages/farmer/SettingsPage";
import MRLCompliancePage from "./pages/farmer/MRLCompliancePage";
import FeedInventoryPage from "./pages/farmer/FeedInventoryPage";
import FeedAdministrationPage from "./pages/farmer/FeedAdministrationPage";
import RaiseTicketPage from "./pages/shared/RaiseTicketPage";
import TicketHistoryPage from "./pages/shared/TicketHistoryPage";


// Vet Page Imports
import VetAppLayout from "./components/layout/VetAppLayout";
import UserManagementPage from "./pages/admin/UserManagementPage";
import AuditsPage from "./pages/admin/AuditsPage";
import SupportPage from "./pages/admin/SupportPage";
import AdminSettingsPage from "./pages/admin/SettingsPage";
import FeedAdministrationRequestsPage from "./pages/vet/FeedAdministrationRequestsPage";

// Admin Page Imports
import AdminAppLayout from "./components/layout/AdminAppLayout";
import AdminDashboardPage from "./pages/admin/DashboardPage";
import VetDashboardPage from "./pages/vet/VetDashboardPage";
import TreatmentRequestsPage from "./pages/vet/TreatmentRequestsPage";
import FarmerDirectoryPage from "./pages/vet/FarmerDirectoryPage";
import VetReportsPage from "./pages/vet/VetReportsPage";
import VetSettingsPage from "./pages/vet/VetSettingsPage";

// Regulator Page Imports
import RegulatorAppLayout from "./components/layout/RegulatorAppLayout";
import RegulatorDashboardPage from "./pages/regulator/DashboardPage";
import CompliancePage from "./pages/regulator/CompliancePage";
import MapViewPage from "./pages/regulator/MapViewPageEnhanced";
import RegulatorReportsPage from "./pages/regulator/ReportsPage";
import RegulatorSettingsPage from "./pages/regulator/SettingsPage";
import TrendsPage from "./pages/regulator/TrendsPage";
import DemographicsPageEnhanced from "./pages/regulator/DemographicsPageEnhanced";
import RegulatorAlertsPage from "./pages/regulator/RegulatorAlertsPage";
import MRLVerificationsPage from "./pages/regulator/MRLVerificationsPage";
import AmuManagementPage from "./pages/regulator/AmuManagementPage";
import FarmsPage from "./pages/regulator/FarmsPage";
import FarmDetailsPage from "./pages/regulator/FarmDetailsPage";
import VetsPage from "./pages/regulator/VetsPage";
import VetDetailsPage from "./pages/regulator/VetDetailsPage";
import PrescriptionsPage from "./pages/regulator/PrescriptionsPage";
import AuditTrailsPage from "./pages/regulator/AuditTrailsPage";
import UserOversightPage from "./pages/regulator/UserOversightPage";

// --- Google Analytics Integration ---

// Initialize Google Analytics
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}

// Component to track page views on route changes
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search, title: document.title });
    }
  }, [location]);

  return null;
};


// --- Layout Component for Public Pages ---
const PublicLayout = () => {
  return (
    <div>
      <Navigation />
      <main>
        <Outlet />
      </main>
    </div>
  );
};


// --- Route Protection Components ---

const ProtectedRoute = ({ children }) => {
  const { isAuth } = useAuth();
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const FarmerRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'farmer') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const VetRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'veterinarian') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const RegulatorRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'regulator') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// --- Main App Component ---

function App() {
  const { isAuth, user } = useAuth();

  const getHomeRedirect = () => {
    if (!isAuth) return <AuthPage />;
    if (user?.role === 'veterinarian') return <Navigate to="/vet/dashboard" />;
    if (user?.role === 'regulator') return <Navigate to="/regulator/dashboard" />;
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" />;
    return <Navigate to="/farmer/dashboard" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SyncProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <HotToaster />

            <AnalyticsTracker />
            <Routes>
              {/* Public Routes with Shared Navigation */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/learn-more" element={<LearnMore />} />
              </Route>

              {/* Standalone Auth Routes */}
              <Route path="/login" element={getHomeRedirect()} />
              <Route path="/register" element={getHomeRedirect()} />

              {/* Protected Farmer Routes */}
              <Route
                path="/farmer"
                element={
                  <ProtectedRoute>
                    <FarmerRoute>
                      <AppLayout />
                    </FarmerRoute>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="animals" element={<AnimalsPage />} />
                <Route path="treatments" element={<TreatmentsPage />} />
                <Route path="sales" element={<SellPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="feed-inventory" element={<FeedInventoryPage />} />
                <Route path="feed-administration" element={<FeedAdministrationPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="mrl-compliance" element={<MRLCompliancePage />} />
                <Route path="support/raise-ticket" element={<RaiseTicketPage />} />
                <Route path="support/history" element={<TicketHistoryPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Protected Vet Routes */}
              <Route
                path="/vet"
                element={
                  <ProtectedRoute>
                    <VetRoute>
                      <VetAppLayout />
                    </VetRoute>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<VetDashboardPage />} />
                <Route path="requests" element={<TreatmentRequestsPage />} />
                <Route path="support/raise-ticket" element={<RaiseTicketPage />} />
                <Route path="support/history" element={<TicketHistoryPage />} />
                <Route path="feed-requests" element={<FeedAdministrationRequestsPage />} />
                <Route path="farmers" element={<FarmerDirectoryPage />} />
                <Route path="reports" element={<VetReportsPage />} />
                <Route path="settings" element={<VetSettingsPage />} />
              </Route>

              {/* Protected Regulator Routes */}
              <Route
                path="/regulator"
                element={
                  <ProtectedRoute>
                    <RegulatorRoute>
                      <RegulatorAppLayout />
                    </RegulatorRoute>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<RegulatorDashboardPage />} />
                <Route path="alerts" element={<RegulatorAlertsPage />} />
                <Route path="amu-management" element={<AmuManagementPage />} />
                <Route path="compliance" element={<CompliancePage />} />
                <Route path="support/raise-ticket" element={<RaiseTicketPage />} />
                <Route path="support/history" element={<TicketHistoryPage />} />
                <Route path="mrl-verifications" element={<MRLVerificationsPage />} />
                <Route path="audit-trails" element={<AuditTrailsPage />} />
                <Route path="users" element={<UserOversightPage />} />
                <Route path="farms" element={<FarmsPage />} />
                <Route path="farms/:id" element={<FarmDetailsPage />} />
                <Route path="vets" element={<VetsPage />} />
                <Route path="vets/:id" element={<VetDetailsPage />} />
                <Route path="prescriptions" element={<PrescriptionsPage />} />
                <Route path="trends" element={<TrendsPage />} />
                <Route path="demographics" element={<DemographicsPageEnhanced />} />
                <Route path="map" element={<MapViewPage />} />
                <Route path="reports" element={<RegulatorReportsPage />} />
                <Route path="settings" element={<RegulatorSettingsPage />} />
              </Route>

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminAppLayout />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="audits" element={<AuditsPage />} />
                <Route path="support" element={<SupportPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<div><h1>404</h1><p>Page not found</p></div>} />
            </Routes>

            {/* Conditionally render the ChatWidget for any authenticated user */}
            {isAuth && <ChatWidget />}

          </TooltipProvider>
        </NotificationProvider>
      </SyncProvider>
    </QueryClientProvider>
  );
}

export default App;