import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    const authToken = localStorage.getItem("authToken");

<<<<<<< HEAD
    return authToken ? <Outlet /> : <Navigate to="/" />;
=======
    return authToken ? <Outlet /> : <Navigate to="/"  replace/>;
>>>>>>> master
};

export default ProtectedRoute;
