import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginSignup from "./Components/LoginSignup";
import Dashboard from "./Components/Dashboard";
import Problem from "./Components/Problem";

import "./App.css";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginSignup />} />
                <Route path="/*" element={<Dashboard />} />
                <Route path="/problem/*" element={<Problem />} />
            </Routes>
        </Router>
    );
}

export default App;
