import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardMedia, Typography, IconButton, AppBar, Toolbar, Box, Button, Avatar, Menu, MenuItem, Tooltip, Alert } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import api, { errorMessage } from "../api/client";
import { clearSession, getUser } from "../auth/session";
import java from "../img/java.png";
import SSSIHL from "../img/SSSIHL.png";
import "../Utils/Dashboard.css";

// Shared by the student dashboard and the staff (admin/teacher) dashboard; the two only differ in navigation targets.
export default function DashboardView({ staff = false }) {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();
  const scroller = useRef(null);
  const user = getUser();
  const base = staff ? "/admin-dashboard" : "/Dashboard";

  useEffect(() => {
    api.get("/api/questions").then((r) => setQuestions(r.data)).catch((e) => setError(errorMessage(e, "Could not load questions")));
  }, []);

  const scroll = (dx) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });
  const logout = () => { clearSession(); navigate("/", { replace: true }); };
  const account = () => navigate(user?.role === "admin" ? "/admin-dashboard/AdminProfile" : "/Dashboard/Profile");

  return (
    <div className="Dashboard">
      <AppBar position="absolute">
        <Toolbar>
          <Box sx={{ display: "flex", gap: 3, flexGrow: 1 }}>
            {staff && <Button color="inherit" component={Link} to="/admin-dashboard/Question">Question</Button>}
          </Box>
          <Box sx={{ flexGrow: 0, ml: 2 }}>
            <Tooltip title={user?.username || "Account"}>
              <IconButton onClick={(e) => setAnchorElUser(e.currentTarget)} sx={{ p: 0 }}>
                <Avatar alt={user?.username || "User"} src={SSSIHL} />
              </IconButton>
            </Tooltip>
            <Menu sx={{ mt: "45px" }} anchorEl={anchorElUser} anchorOrigin={{ vertical: "top", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} open={Boolean(anchorElUser)} onClose={() => setAnchorElUser(null)}>
              <MenuItem onClick={account}>Account</MenuItem>
              <MenuItem onClick={logout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <div className="question-container">
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!error && questions.length === 0 && <Alert severity="info">No questions are available right now.</Alert>}
        <div className="carousel-container">
          <IconButton className="scroll-button left" aria-label="Scroll left" onClick={() => scroll(-300)}><ArrowBackIos /></IconButton>
          <div className="card-container" ref={scroller}>
            {questions.map((q) => (
              <Card key={q._id} className="question-card" onClick={() => navigate(`${base}/Problem`, { state: { id: q._id, title: q.title } })} sx={{ cursor: "pointer" }}>
                <CardMedia component="img" height="140" src={java} alt="" />
                <CardContent>
                  <Typography gutterBottom variant="h5">{q.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{q.deadline ? `Due ${q.deadline}` : "No deadline"}</Typography>
                  <Typography variant="body2" color="primary">{q.difficulty}</Typography>
                </CardContent>
              </Card>
            ))}
          </div>
          <IconButton className="scroll-button right" aria-label="Scroll right" onClick={() => scroll(300)}><ArrowForwardIos /></IconButton>
        </div>
      </div>
    </div>
  );
}
