
import { Navigate } from "react-router-dom";

const Index = () => {
  // Direct redirect to dashboard
  return <Navigate to="/dashboard" replace />;
};

export default Index;
