<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Layout, Typography, Button, Input, Splitter } from "antd";
=======
import React, { useState } from "react";
import axios from "axios";
import { Layout, Typography, Button, Input, Splitter } from "antd";
import Description from "./Description";
import Editorial from "./Editorial";
import Solution from "./Solution";
import Submission from "./Submission";
>>>>>>> master
import "../Utils/Problem.css";
import { useLocation } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
<<<<<<< HEAD
import Description from "./Description";
import Editorial from "./Editorial";
import Solution from "./Solution";
import Submission from "./Submission";

=======
>>>>>>> master

const Desc = ({ text }) => (
  <div style={{ textAlign: "center", padding: "10px" }}>
    <Typography.Title type="secondary" level={5} style={{ whiteSpace: "nowrap" }}>
      {text}
    </Typography.Title>
  </div>
);

<<<<<<< HEAD

export default function Problem() {
  const [selectedTab, setSelectedTab] = useState("description");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [problem, setProblem] = useState({ title: "", description: "", testCases: "" });
  useEffect(() => {
    if (location.state?.title) {
        console.log(" Fetching problem:", location.state.title); // Debugging
        axios.get(`http://localhost:5000/api/questions/${location.state.title}`)
            .then(response => setProblem(response.data))
            .catch(error => console.error(" Error fetching problem details:", error));
    } else {
        console.error(" No title found in location.state");
    }
}, [location.state]);



=======
export default function Problem() {
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [open, setOpen] = useState(false);
  const location = useLocation(); 
>>>>>>> master

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };
<<<<<<< HEAD


  const DrawerList = (
    <Box sx={{ width: 450 }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
        {problem.title ? (
          <ListItem key={problem.title} disablePadding>
            <ListItemButton>
              <ListItemText primary={problem.title} />
            </ListItemButton>
          </ListItem>
        ) : (
          <p>No question selected.</p>
        )}
      </List>
    </Box>
  );
=======
const DrawerList = (
  <Box sx={{ width: 450 }} role="presentation" onClick={toggleDrawer(false)}>
    <List>
      {location.state ? ( 
        <ListItem key={location.state.title} disablePadding>
          <ListItemButton onClick={() => console.log(location.state)}>
            <ListItemText primary={location.state.title} />
          </ListItemButton>
        </ListItem>
      ) : (
        <p>No question selected.</p>
      )}
    </List>
  </Box>
);
>>>>>>> master


  const handleSubmit = async () => {
    const payload = {
      language: "cpp",
      code,
    };
    try {
      const { data } = await axios.post("http://localhost:5000/run", payload);
      setOutput(data.output);
    } catch (err) {
      console.log(err.response);
    }
  };

<<<<<<< HEAD

  return (
    <div className="Problem-Bar">
      <Layout style={{ height: "100vh", background: "#fff" }}>
        <div className="Buttons">
          <Button onClick={toggleDrawer(true)}>Problem List</Button>
=======
  return (
    <div className="Problem-Bar">
      <Layout style={{ height: "100vh", background: "#fff" }}>
        <div className="Buttons"> 
          <Button onClick={toggleDrawer(true)} sx={{ minWidth: 100, padding: "6px 12px" }}>
            Problem List
          </Button>
>>>>>>> master
          <Button>Time</Button>
          <Button>Note</Button>
        </div>

<<<<<<< HEAD

=======
>>>>>>> master
        <Drawer open={open} onClose={toggleDrawer(false)}>
          {DrawerList}
        </Drawer>

<<<<<<< HEAD

        <Splitter style={{ height: "100%" }}>
          {/* Left Panel - Problem Details */}
          <Splitter.Panel style={{ borderRight: "1px solid #ddd", padding: "10px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
            {/* Problem Title */}
            <Typography.Title level={4} style={{ textAlign: "center" }}>
              {problem.title || "No Problem Selected"}
            </Typography.Title>


            {/* Tabs for Description, Editorial, Solution, Submission */}
            <div className="options" style={{ marginTop: "10px", display: "flex", justifyContent: "space-around" }}>
              <Button type={selectedTab === "description" ? "primary" : "default"} onClick={() => setSelectedTab("description")}>
                Description
              </Button>
              <Button type={selectedTab === "editorial" ? "primary" : "default"} onClick={() => setSelectedTab("editorial")}>
                Editorial
              </Button>
              <Button type={selectedTab === "solution" ? "primary" : "default"} onClick={() => setSelectedTab("solution")}>
                Solution
              </Button>
              <Button type={selectedTab === "submission" ? "primary" : "default"} onClick={() => setSelectedTab("submission")}>
                Submission
              </Button>
            </div>


            {/* Dynamic Content Rendering Based on Selected Tab */}
            <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", backgroundColor: "#f9f9f9", flexGrow: 1, display: "flex", flexDirection: "column" }}>
              {selectedTab === "description" && (
                <div>
                
                 
                </div>
              )}
               {selectedTab === "description" && <Description />}
              {selectedTab === "editorial" && <Editorial />}
              {selectedTab === "solution" && <Solution />}
              {selectedTab === "submission" && <Submission />}
            </div>
          </Splitter.Panel>


          {/* Right Panel - Code Editor & Test Cases */}
          <Splitter.Panel style={{ height: "100%", display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <Splitter layout="vertical" style={{ height: "100%" }}>
              {/* Code Editor */}
              <Splitter.Panel style={{ padding: "10px", height: "50%", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <Desc text="Online Code Compiler" />
                <div className="coding-block" style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
=======
        <Splitter style={{ height: "100%" }}>
          <Splitter.Panel style={{ borderRight: "1px solid #ddd", padding: "10px" }}>
            <div className="options" style={{ marginTop: "10px" }}>
              <Description setMessage={setMessage} />
              <Editorial setMessage={setMessage} />
              <Solution setMessage={setMessage} />
              <Submission setMessage={setMessage} />
            </div>
            <p>{message}</p>
          </Splitter.Panel>
          <Splitter.Panel style={{ height: "100%" }}>
            <Splitter layout="vertical" style={{ height: "100%" }}>
              <Splitter.Panel style={{ padding: "10px", height: "50%" }}>
                <Desc text="Online Code Compiler" />
                <div className="coding-block">
>>>>>>> master
                  <Input.TextArea
                    rows={9}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Write your code here..."
<<<<<<< HEAD
                    style={{ width: "100%", flexGrow: 1 }}
=======
                    style={{ width: "100%" }}
>>>>>>> master
                  />
                  <Button type="primary" onClick={handleSubmit} style={{ marginTop: "10px" }}>
                    Submit
                  </Button>
                  <p>{output}</p>
                </div>
              </Splitter.Panel>
<<<<<<< HEAD


              {/* Test Cases */}
              <Splitter.Panel style={{ padding: "10px", height: "50%", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <div className="test-cases-block" style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  <Desc text="Test Cases" />
                  <div style={{ flexGrow: 1, overflow: "auto" }}>
                    {problem.testCases ? (
                      <pre style={{ background: "#eef", padding: "10px", borderRadius: "5px" }}>
                        {problem.testCases}
                      </pre>
                    ) : (
                      <p>No test cases available.</p>
                    )}
                  </div>
=======
              <Splitter.Panel style={{ padding: "10px", height: "50%" }}>
                <div className="test-cases-block">
                  <Desc text="Test Cases" />
                  <p>
                    <strong>Example 1:</strong> <br />
                    Input: s = "abcabcbb" <br />
                    Output: 3 <br />
                    Explanation: The answer is "abc", with the length of 3.
                  </p>
                  <p>
                    <strong>Example 2:</strong> <br />
                    Input: s = "bbbbb" <br />
                    Output: 1 <br />
                    Explanation: The answer is "b", with the length of 1.
                  </p>
>>>>>>> master
                </div>
              </Splitter.Panel>
            </Splitter>
          </Splitter.Panel>
        </Splitter>
<<<<<<< HEAD
=======

        
>>>>>>> master
      </Layout>
    </div>
  );
}


<<<<<<< HEAD

=======
>>>>>>> master
