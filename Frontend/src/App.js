<<<<<<< HEAD
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginSignup from "./Components/LoginSignup";
import Dashboard from "./Components/Dashboard";
import Problem from "./Components/Problem";

import "./App.css";

=======
import ProtectedRoute from "./Components/ProtectedRoute";
import Dashboard from "./Components/Dashboard";
import LoginSignup from "./Components/LoginSignup";
import Home from "./Components/Home";
import Question from "./Components/Question";
import Post from "./Components/Post";
import Discuss from "./Components/Discuss";
import Problem from "./Components/Problem";

>>>>>>> master
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginSignup />} />
<<<<<<< HEAD
                <Route path="/*" element={<Dashboard />} />
                <Route path="/problem/*" element={<Problem />} />
=======
                <Route element={<ProtectedRoute />}>
                    <Route path="/Dashboard" element={<Dashboard />} />
                    <Route path="/Dashboard/Home" element={<Home />} />
                    <Route path="/Dashboard/Question" element={<Question />} />
                    <Route path="/Dashboard/Question/Problem" element={<Problem/>} />
                    <Route path="/Dashboard/Post" element={<Post />} />
                    <Route path="/Dashboard/Discuss" element={<Discuss />} />
                </Route>
                
>>>>>>> master
            </Routes>
        </Router>
    );
}

export default App;
