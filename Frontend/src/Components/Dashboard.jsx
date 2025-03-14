import * as React from "react";
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
// import { createTheme } from "@mui/material/styles";
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Tooltip
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import "../Utils/Dashboard.css";
import java from "../img/java.png";

export default function Dashboard() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = React.useState(false);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Remove token
    navigate('/', { replace: true }); // Redirect to login page
  };

  const handleThemeChange = () => {
    setDarkMode(!darkMode);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <div className="Dashboard">
      <AppBar position="absolute" sx={{ backgroundColor: darkMode ? "#121212" : "#fff" }}>
        <Toolbar>
          <Box sx={{ display: "flex", gap: 3, flexGrow: 1 }}>
            <Button color="inherit" component={Link} to="/Dashboard/Question">Question</Button>
            <Button color="inherit" component={Link} to="/Dashboard/Discuss">Discuss</Button>
            <Button color="inherit" component={Link} to="/Dashboard/Post">Post</Button>
          </Box>

          <IconButton onClick={handleThemeChange} color="inherit">
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

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

              <MenuItem onClick={handleCloseUserMenu}>Account</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      

      <Card sx={{ maxWidth: 345 }}>
      <CardMedia
        component="img"
        alt="green iguana"
        height="140"
        src={java}
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          JAVA
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          factorial of a number
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small">Share</Button>
        <Button size="small">Learn More</Button>
      </CardActions>
    </Card>
    </div>
  );
}
