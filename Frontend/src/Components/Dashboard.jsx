import * as React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AppBar, Toolbar, Typography, IconButton, Box, Button } from "@mui/material";
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

  return (
    
    <ThemeProvider theme={theme}>
    
      <AppBar position="static" sx={{ backgroundColor: darkMode ? "#121212" : "#fff" }}>
        <Toolbar>
          <Box sx={{ display: "flex", gap: 3, flexGrow: 1 }}>
            <Button color="inherit" component={Link} to="home">
              Home
            </Button>
            <Button color="inherit" component={Link} to="question">
              Question
            </Button>
            <Button color="inherit" component={Link} to="discuss">
              Discuss
            </Button>
            <Button color="inherit" component={Link} to="post">
              Post
            </Button>
          </Box>

          <IconButton onClick={handleThemeChange} color="inherit">
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ p: 3 }}>
        <Routes>
          <Route index element={<Typography variant="h4" align="center">Welcome! The dashboard should come here!!</Typography>} />
          <Route path="home" element={<Home />} />
          <Route path="problem" element={<Problem />} />
          <Route path="discuss" element={<Discuss />} />
          <Route path="post" element={<Post />} />
          <Route path="question" element={<Question />} />
          <Route path="*" element={<Typography variant="h4" align="center">Jai Sai Ram, Page Not Found</Typography>} />
        </Routes>
      </Box>
   
    </ThemeProvider>
    
  );
}
