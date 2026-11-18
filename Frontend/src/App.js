import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute";
import Dashboard from "./Components/Dashboard";
import LoginSignup from "./Components/LoginSignup";
import Question from "./Components/Question";
import Problem from "./Components/Problem";
import Profile from "./Components/Profile";
import AdminProfile from "./Components/AdminProfile";
import AdminDashboard from "./Components/admin-dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />

        {/* Any signed-in user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Dashboard/Profile" element={<Profile />} />
          <Route path="/Dashboard/Problem" element={<Problem />} />
        </Route>

        {/* Staff area: admin and teacher (the API enforces what each may do) */}
        <Route element={<ProtectedRoute roles={["admin", "teacher"]} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-dashboard/Question" element={<Question />} />
          <Route path="/admin-dashboard/Question/Problem" element={<Problem />} />
          <Route path="/admin-dashboard/Problem" element={<Problem />} />
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin-dashboard/AdminProfile" element={<AdminProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
