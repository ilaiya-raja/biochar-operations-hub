
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Farmers from "@/pages/Farmers";
import Coordinator from "@/pages/Coordinators";
import Kiln from "@/pages/Kilns";
import Fertilizer from "@/pages/Fertilizers";
import Locations from "@/pages/Locations";
import Biomass from "@/pages/Biomass";
import NotFound from "@/pages/NotFound";
import BiomassCollection from "@/pages/coordinator/BiomassCollection";
import PyrolysisProcess from "@/pages/coordinator/PyrolysisProcess";
import FertilizerDistribution from "@/pages/coordinator/FertilizerDistribution";
import ResetPassword from "@/pages/ResetPassword";
import SetPassword from "@/pages/set-password";
import BiomassTypes from "./pages/biomass-types";
// First fix the import path

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/set-password" element={<SetPassword />} />
            
            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Allow access to both admin and coordinator roles */}
                <Route element={<PrivateRoute allowedRoles={['admin', 'coordinator']} />}>
                  <Route path="/farmers" element={<Farmers />} />
                  <Route path="/biomass" element={<Biomass />} />
                  <Route path="/biomass-types" element={<BiomassTypes />} />  {/* Added this route */}
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/coordinators" element={<Coordinator />} />
                  <Route path="/kilns" element={<Kiln />} />
                  <Route path="/fertilizer" element={<Fertilizer />} />
                </Route>

                {/* Coordinator routes */}
                <Route element={<PrivateRoute allowedRoles={['coordinator']} />}>
                  <Route path="/biomass-collection" element={<BiomassCollection />} />
                  <Route path="/pyrolysis" element={<PyrolysisProcess />} />
                  <Route path="/fertilizer-distribution" element={<FertilizerDistribution />} />
                </Route>
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
