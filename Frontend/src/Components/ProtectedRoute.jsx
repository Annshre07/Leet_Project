import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({ adminOnly = false }) => {
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
  const token = localStorage.getItem("authToken");
  const location = useLocation();

  if (!token || !user) return <Navigate to="/" state={{ from: location }} replace />;

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/Dashboard" replace />; // Redirect non-admin users
  }

  return <Outlet />;
};

export default ProtectedRoute;
