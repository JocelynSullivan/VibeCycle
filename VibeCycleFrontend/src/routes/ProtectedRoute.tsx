import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const auth = useAuth();
  if (!auth) {
    console.log("No auth context available");
    return null;
  } else {
    console.log("Auth context:", auth);
  }

  const { token } = auth;

  if (!token) {
    return <Navigate to="/login" />;
  } else {
    console.log(token);
  }

  return children;
};
