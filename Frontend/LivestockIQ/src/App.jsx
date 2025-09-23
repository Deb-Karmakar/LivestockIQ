import { Route, Routes, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Core Page Imports
import LandingPage from "@/pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "./contexts/AuthContext";

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

// Vet Page Imports
import VetAppLayout from "./components/layout/VetAppLayout";
import VetDashboardPage from "./pages/vet/VetDashboardPage";
import TreatmentRequestsPage from "./pages/vet/TreatmentRequestsPage";
import FarmerDirectoryPage from "./pages/vet/FarmerDirectoryPage";
import VetReportsPage from "./pages/vet/VetReportsPage";
import VetSettingsPage from "./pages/vet/VetSettingsPage";

// NEW: Regulator Page Imports
import RegulatorAppLayout from "./components/layout/RegulatorAppLayout";
import RegulatorDashboardPage from "./pages/regulator/DashboardPage";
import CompliancePage from "./pages/regulator/CompliancePage";
import MapViewPage from "./pages/regulator/MapViewPage";
import RegulatorReportsPage from "./pages/regulator/ReportsPage";
import RegulatorSettingsPage from "./pages/regulator/SettingsPage";
import TrendsPage from "./pages/regulator/TrendsPage";


// --- Route Protection Components ---

// General protected route: checks if user is logged in at all
const ProtectedRoute = ({ children }) => {
  const { isAuth } = useAuth();
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Role-specific route for farmers
const FarmerRoute = ({ children }) => {
    const { user } = useAuth();
    if (user?.role !== 'farmer') {
        return <Navigate to="/login" replace />;
    }
    return children;
}

// Role-specific route for vets
const VetRoute = ({ children }) => {
    const { user } = useAuth();
    if (user?.role !== 'veterinarian') {
        return <Navigate to="/login" replace />;
    }
    return children;
}

// NEW: Role-specific route for regulators
const RegulatorRoute = ({ children }) => {
    const { user } = useAuth();
    if (user?.role !== 'regulator') {
        return <Navigate to="/login" replace />;
    }
    return children;
}

// --- Main App Component ---

function App() {
  const { isAuth, user } = useAuth();

  // UPDATED: Helper to determine where to redirect logged-in users
  const getHomeRedirect = () => {
      if (!isAuth) return <AuthPage />;
      if (user?.role === 'veterinarian') return <Navigate to="/vet/dashboard" />;
      if (user?.role === 'regulator') return <Navigate to="/regulator/dashboard" />;
      return <Navigate to="/farmer/dashboard" />; // Default to farmer
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
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
            <Route path="sell" element={<SellPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="alerts" element={<AlertsPage />} />
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
            <Route path="farmers" element={<FarmerDirectoryPage />} />
            <Route path="reports" element={<VetReportsPage />} />
            <Route path="settings" element={<VetSettingsPage />} />
          </Route>
          
          {/* NEW: Protected Regulator Routes */}
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
            <Route path="compliance" element={<CompliancePage />} />
            <Route path="trends" element={<TrendsPage />} />
            <Route path="map" element={<MapViewPage />} />
            <Route path="reports" element={<RegulatorReportsPage />} />
            <Route path="settings" element={<RegulatorSettingsPage />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<div><h1>404</h1><p>Page not found</p></div>} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;