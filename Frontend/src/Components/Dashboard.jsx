import * as React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
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
import Home from "./Home";
import Problem from "./Problem";
import Discuss from "./Discuss";
import Post from "./Post";
import Question from "./Question";
import "../Utils/Dashboard.css";

export default function Dashboard() {
  const [darkMode, setDarkMode] = React.useState(false);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: "#fff" },
      background: {
        default: darkMode ? "#121212" : "#fff",
        paper: darkMode ? "#121212" : "#fff",
      },
    },
  });

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
    <ThemeProvider theme={theme}>
      <AppBar position="static" sx={{ backgroundColor: darkMode ? "#121212" : "#fff" }}>
        <Toolbar>
          <Box sx={{ display: "flex", gap: 3, flexGrow: 1 }}>
            <Button color="inherit" component={Link} to="/home">Home</Button>
            <Button color="inherit" component={Link} to="/question">Question</Button>
            <Button color="inherit" component={Link} to="/discuss">Discuss</Button>
            <Button color="inherit" component={Link} to="/post">Post</Button>
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
              <MenuItem onClick={handleCloseUserMenu}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ p: 3 }}>
        <Routes>
          <Route path="/" element={<Typography variant="h4" align="center">Welcome to Dashboard!</Typography>} />
          <Route path="/home" element={<Home />} />
          <Route path="/problem" element={<Problem />} />
          <Route path="/discuss" element={<Discuss />} />
          <Route path="/post" element={<Post />} />
          <Route path="/question" element={<Question />} />
          <Route path="*" element={<Typography variant="h4" align="center">Jai Sai Ram, Page Not Found</Typography>} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}
