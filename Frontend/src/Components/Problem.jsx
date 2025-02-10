import React, { useState } from "react";
import axios from "axios";
import { Layout, Typography, Button, Input, Splitter } from "antd";
import Description from "./Description";
import Editorial from "./Editorial";
import Solution from "./Solution";
import Submission from "./Submission";
import "../Utils/Problem.css";
import { useLocation } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";

const Desc = ({ text }) => (
  <div style={{ textAlign: "center", padding: "10px" }}>
    <Typography.Title type="secondary" level={5} style={{ whiteSpace: "nowrap" }}>
      {text}
    </Typography.Title>
  </div>
);

export default function Problem() {
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [open, setOpen] = useState(false);
  const location = useLocation(); 

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };
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

  return (
    <div className="Problem-Bar">
      <Layout style={{ height: "100vh", background: "#fff" }}>
        <div className="Buttons"> 
          <Button onClick={toggleDrawer(true)} sx={{ minWidth: 100, padding: "6px 12px" }}>
            Problem List
          </Button>
          <Button>Time</Button>
          <Button>Note</Button>
        </div>

        <Drawer open={open} onClose={toggleDrawer(false)}>
          {DrawerList}
        </Drawer>

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
                  <Input.TextArea
                    rows={9}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Write your code here..."
                    style={{ width: "100%" }}
                  />
                  <Button type="primary" onClick={handleSubmit} style={{ marginTop: "10px" }}>
                    Submit
                  </Button>
                  <p>{output}</p>
                </div>
              </Splitter.Panel>
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
                </div>
              </Splitter.Panel>
            </Splitter>
          </Splitter.Panel>
        </Splitter>

        
      </Layout>
    </div>
  );
}


