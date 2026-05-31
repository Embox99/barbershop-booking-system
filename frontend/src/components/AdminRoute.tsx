import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "./PageLoader";

export const AdminRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
