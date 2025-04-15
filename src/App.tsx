
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
import Biomass from "@/pages/Biomass";
import Fertilizer from "@/pages/Fertilizers";
import Locations from "@/pages/Locations";
import BiomassCollection from "@/pages/coordinator/BiomassCollection";
import PyrolysisProcess from "@/pages/coordinator/PyrolysisProcess";
import BiofertilizerDistribution from "@/pages/coordinator/BiofertilizerDistribution";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Routes for both admin and coordinator */}
            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Admin-only routes */}
                <Route element={<PrivateRoute requiredRole="admin" />}>
                  <Route path="/farmers" element={<Farmers />} />
                  <Route path="/biomass" element={<Biomass />} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/coordinators" element={<Coordinator />} />
                  <Route path="/kilns" element={<Kiln />} />
                  <Route path="/fertilizer" element={<Fertilizer />} />
                </Route>
                
                {/* Coordinator-only routes */}
                <Route element={<PrivateRoute requiredRole="coordinator" />}>
                  <Route path="/biomass-collection" element={<BiomassCollection />} />
                  <Route path="/pyrolysis-process" element={<PyrolysisProcess />} />
                  <Route path="/biofertilizer-distribution" element={<BiofertilizerDistribution />} />
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
