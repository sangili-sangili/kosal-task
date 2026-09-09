import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

/**
 * Route guard component protecting private CRM routes
 */
export function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
