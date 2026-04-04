import React from "react";
import { Navigate } from "react-router-dom";

export const AdminProtectedRoute = ({ children }) => {
  // Check admin token from localStorage (or context)
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    // If no token -> redirect to admin login
    return <Navigate to="/admin/login" replace />;
  }

  // If token exists -> render the children (admin component)
  return children;
};
