import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from "react-router-dom";
import { 
  Card, CardContent, CardMedia, Typography, IconButton 
} from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import java from "../img/java.png";  // Import image for cards
import '../Utils/Dashboard.css';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Tooltip
} from "@mui/material";

export default function Question() {
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  // Fetch questions from backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/questions')
      .then(response => setQuestions(response.data))
      .catch(error => console.error('Error fetching questions:', error));
  }, []);

  // Scroll functions
  const scrollLeft = () => {
    scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };
  
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  
    const handleLogout = () => {
      localStorage.removeItem('authToken'); // Remove token
      navigate('/', { replace: true }); // Redirect to login page
    };
    const handleProfile = () => {
      navigate('/admin-dashboard/AdminProfile'); // Redirect to login page
    };
  
    const handleOpenUserMenu = (event) => {
      setAnchorElUser(event.currentTarget);
    };
  
    const handleCloseUserMenu = () => {
      setAnchorElUser(null);
    };

  return (
    <div className='Dashboard'>
        <AppBar position="absolute">
        <Toolbar>
          <Box sx={{ display: "flex", gap: 3, flexGrow: 1 }}>
            <Button color="inherit" component={Link} to="/admin-dashboard/Question">Question</Button>
            <Button color="inherit" component={Link} to="/Discuss">Discuss</Button>
          </Box>

          {/* Profile Section */}
          <Box sx={{ flexGrow: 0, ml: 2 }}>
            <Tooltip title="Open Profile">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="A" src="../img/SSSIHL.png" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={handleProfile}>Account</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
    <div className='question-container'>
      {/* Scrollable Cards Container */}
      <div className="carousel-container">
        <IconButton className="scroll-button left" onClick={scrollLeft}>
          <ArrowBackIos />
        </IconButton>

        <div className="card-container" ref={scrollContainerRef}>
          {questions.map((question, index) => (
            <Card key={index} className="question-card" onClick={() => navigate('/admin-dashboard/Problem', { state: question })}>
              <CardMedia component="img" height="140" src={java} />
              <CardContent>
                <Typography gutterBottom variant="h5">{question.title}</Typography>
                <Typography variant="body2" color="text.secondary">{question.status}</Typography>
                <Typography variant="body2" color="primary">{question.difficulty}</Typography>
              </CardContent>
            </Card>
          ))}
        </div>

        <IconButton className="scroll-button right" onClick={scrollRight}>
          <ArrowForwardIos />
        </IconButton>
      </div>
    </div>
    </div>
  );
}
