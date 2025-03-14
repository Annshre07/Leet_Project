import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('authToken'); // Check if token exists
  const location = useLocation();

  return token ? <Outlet /> : <Navigate to="/" state={{ from: location }} replace />;
};

export default ProtectedRoute;
