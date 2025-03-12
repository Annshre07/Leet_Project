import ProtectedRoute from "./Components/ProtectedRoute";
import Dashboard from "./Components/Dashboard";
import LoginSignup from "./Components/LoginSignup";
import Home from "./Components/Home";
import Question from "./Components/Question";
import Post from "./Components/Post";
import Discuss from "./Components/Discuss";
import Problem from "./Components/Problem";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginSignup />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/Dashboard" element={<Dashboard />} />
                    <Route path="/Dashboard/Home" element={<Home />} />
                    <Route path="/Dashboard/Question" element={<Question />} />
                    <Route path="/Dashboard/Question/Problem" element={<Problem/>} />
                    <Route path="/Dashboard/Post" element={<Post />} />
                    <Route path="/Dashboard/Discuss" element={<Discuss />} />
                </Route>
                
            </Routes>
        </Router>
    );
}

export default App;
