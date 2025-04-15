
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/Spinner';

interface PrivateRouteProps {
  requiredRole?: 'admin' | 'coordinator' | 'any';
}

export const PrivateRoute = ({ requiredRole = 'any' }: PrivateRouteProps) => {
  const { user, isLoading, userProfile } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check if the user has that role
  if (requiredRole !== 'any' && userProfile?.role !== requiredRole) {
    console.log('User missing required role:', requiredRole, 'Current role:', userProfile?.role);
    // Only redirect if user doesn't have the required role
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
