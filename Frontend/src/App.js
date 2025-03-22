import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from "./Components/ProtectedRoute";
import Dashboard from "./Components/Dashboard";
import LoginSignup from "./Components/LoginSignup";
import Question from "./Components/Question";
import Discuss from "./Components/Discuss";
import Problem from "./Components/Problem";
import Profile from './Components/Profile';
import AdminProfile from './Components/AdminProfile';
import AdminDashboard from './Components/admin-dashboard';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Route */}
                <Route path="/" element={<LoginSignup />} />

                {/* Protected User Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/Dashboard" element={<Dashboard />} />
                    <Route path="/Dashboard/Profile" element={<Profile />} />
                    <Route path="/Dashboard/Problem" element={<Problem />} />
                    <Route path="/Discuss" element={<Discuss />} />
                </Route>

                {/* Admin-Only Routes */}
                <Route element={<ProtectedRoute adminOnly={true} />}>
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/admin-dashboard/AdminProfile" element={<AdminProfile />} />
                    <Route path="/admin-dashboard/Question" element={<Question />} />
                    <Route path="/admin-dashboard/Question/Problem" element={<Problem />} />
                    <Route path="/admin-dashboard/Problem" element={<Problem />} />

                </Route>

                {/* Redirect unknown routes to login */}
                <Route path="*" element={<LoginSignup />} />
            </Routes>
        </Router>
    );
}

export default App;
