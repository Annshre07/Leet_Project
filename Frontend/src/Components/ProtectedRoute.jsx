import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUser, isAuthenticated, clearSession, homeFor } from "../auth/session";

// Route guard for UX only: the API enforces every permission on the server.
// `roles` limits a route to certain roles; `adminOnly` is kept for the 1.x route definitions (admin + teacher staff area).
const ProtectedRoute = ({ roles, adminOnly = false }) => {
  const location = useLocation();
  if (!isAuthenticated()) {
    clearSession();
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  const user = getUser();
  const allowed = roles || (adminOnly ? ["admin", "teacher"] : null);
  if (allowed && !allowed.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
};

export default ProtectedRoute;
