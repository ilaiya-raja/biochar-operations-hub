
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/Spinner';

interface PrivateRouteProps {
  allowedRoles?: string[];
}

export const PrivateRoute = ({ allowedRoles }: PrivateRouteProps) => {
  const { user, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow coordinators to access the same pages as admin
  const effectiveRole = userRole === 'coordinator' ? 'admin' : userRole;
  
  if (allowedRoles && !allowedRoles.includes(effectiveRole ?? '')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
