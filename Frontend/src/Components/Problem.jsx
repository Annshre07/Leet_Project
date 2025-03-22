import React, { useState, useEffect,useRef } from "react";
import axios from "axios";
import { Layout, Typography, Button,  Splitter } from "antd";
import "../Utils/Problem.css";
import { useLocation } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { Editor,loader } from "@monaco-editor/react";

import Description from "./Description";
import Solution from "./Solution";
import Submission from "./Submission";

export default function Problem() {
  const [language,selectedLanguage]=useState("cpp");
  const [selectedTab, setSelectedTab] = useState("description");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [theme, setTheme] = useState("myDarkTheme");
  const [message, setMessage] = useState("");
  const editorRef = useRef(null);

  const [problem, setProblem] = useState({
    title: "",
    description: "",
    question: "",
    testCases: [],
  });
  
  useEffect(() => {
    loader.init().then((monaco) => {
      // Dark Theme
      monaco.editor.defineTheme("myDarkTheme", {
        base: "vs-dark",
        inherit: true,
        rules: [{ token: "comment", foreground: "ffa500", fontStyle: "italic" }],
        colors: {
          "editor.foreground": "#ffffff",
          "editor.background": "#1e1e1e",
          "editorCursor.foreground": "#ffcc00",
          "editor.lineHighlightBackground": "#2c313a",
          "editor.selectionBackground": "#3e4451",
        },
      });

      // Light Theme
      monaco.editor.defineTheme("myLightTheme", {
        base: "vs",
        inherit: true,
        rules: [{ token: "comment", foreground: "008000", fontStyle: "italic" }],
        colors: {
          "editor.foreground": "#000000",
          "editor.background": "#f5f5f5",
          "editorCursor.foreground": "#ff0000",
          "editor.lineHighlightBackground": "#e8e8e8",
          "editor.selectionBackground": "#d6d6d6",
        },
      });
    });
  }, []);
  
  

  
    // ✅ Fixed ResizeObserver
    useEffect(() => {
      const container = document.getElementById("editor-container");
      if (!container || !editorRef.current) return;
  
      let timeoutId = null;
  
      const observer = new ResizeObserver(() => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.layout();
          }
        }, 100);
      });
  
      observer.observe(container);
  
      return () => {
        clearTimeout(timeoutId);
        observer.disconnect();
      };
    }, []);

  useEffect(() => {
    
    if (location.state?.title) {
      console.log("Fetching problem:", location.state.title);
      const encodedTitle = encodeURIComponent(location.state.title);
      axios.get(`http://localhost:5000/api/questions/${encodedTitle}`)
        .then((response) => {
          console.log("Fetched problem:", response.data);
          setProblem(response.data);
        })
        .catch((error) => console.error("Error fetching problem details:", error));
    } else {
      console.error("No title found in location.state");
    }
  }, [location.state?.title]);

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };
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
  const handleSubmit = async () => {
    if (!problem?.testCases || problem.testCases.length === 0) {
      setMessage("No test cases available.");
      return;
    }
  
    const results = [];
  
    for (const testCase of problem.testCases) {
      const payload = {
        language:"cpp",
        code, 
      };
      try {
        const { data } = await axios.post("http://127.0.0.1:5000/run", payload);
        console.log("Raw API Output:", data.output);
        console.log("Expected Output:", testCase.expectedOutput);
  
        const normalizeOutput = (output) =>
          String(output)
            .trim()
            .replace(/\s+/g, "")  ``
            .replace(/;$/, "")
            .toLowerCase();
        
  
        const actualOutput = normalizeOutput(data.output);
        const expectedOutput = normalizeOutput(testCase.expectedOutput);
  
        results.push({
          input: testCase.input || "N/A",
          expectedOutput: testCase.expectedOutput,
          actualOutput: data.output,
          status: actualOutput === expectedOutput ? "✅ Passed" : "❌ Failed",
        });
  
      } catch (err) {
        console.error("Error running code:", err);
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: "Error",
          status: "❌ Error",
        });
      }
    }
  
    const formattedResults = results
      .map((result) => `${result.status}: Expected(${result.expectedOutput}) | Got(${result.actualOutput})`)
      .join("\n");

    setOutput(formattedResults || "❌ No test cases passed.");
  };

  const tabComponents = {
    description: (props) => <Description problem={problem} {...props} />, 
    solution: (props) => <Solution {...props} />, 
    submission: (props) => <Submission {...props} />
  };

  return (
    <div className="Problem-Bar">
      <Layout style={{ height: "100vh", background: "#fff" }}>
        <div className="Buttons">
          <Button onClick={toggleDrawer(true)}>Problem List</Button>
          <Button>Time</Button>
          <Button>Note</Button>
          <Button type="primary" onClick={handleSubmit} style={{ marginTop: "10px" }}>Submit</Button>
        </div>

        <Drawer open={open} onClose={toggleDrawer(false)}>{DrawerList}</Drawer>

        <Splitter style={{ height: "100%" }}>
          <Splitter.Panel style={{ borderRight: "1px solid #ddd", padding: "10px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <Typography.Title level={4} style={{ textAlign: "center" }}>{problem.title || "No Problem Selected"}</Typography.Title>

            <div className="options" style={{ marginTop: "10px", display: "flex", justifyContent: "space-around" }}>
              {Object.keys(tabComponents).map((tab) => (
                <Button key={tab} type={selectedTab === tab ? "primary" : "default"} onClick={() => setSelectedTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>

            <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", backgroundColor: "#f9f9f9", flexGrow: 1, display: "flex", flexDirection: "column" }}>
              {React.createElement(tabComponents[selectedTab], { setMessage })}
            </div>
            <div style={{ textAlign: "center", marginTop: "10px", color: "blue", fontWeight: "bold" }}>{message}</div>
          </Splitter.Panel>

          <Splitter.Panel style={{ height: "100%", display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <Splitter layout="vertical" style={{ height: "100%" }}>
            <Splitter.Panel style={{ padding: "10px", height: "50%", display: "flex", flexDirection: "column", flexGrow: 1 }}>
  <Typography.Title level={5} style={{ textAlign: "center" }}>Online Code Compiler</Typography.Title>
  
  <div className="coding-block" style={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100%" }}>
    {/* ✅ Language Dropdown */}
    <select value={language} onChange={(e) => selectedLanguage(e.target.value)} className="language-dropdown">
      <option value="cpp">C++</option>
      <option value="c">C</option>
      <option value="python">Python</option>
      <option value="java">Java</option>
      <option value="javascript">JavaScript</option>
    </select>

    {/* ✅ Theme Dropdown */}
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="myDarkTheme">Dark Theme</option>
      <option value="myLightTheme">Light Theme</option>
    </select>
              
    {/* ✅ Monaco Editor with Responsive Height */}
    <div id="editor-container" style={{ height: "60vh", border: "1px solid #ddd" }}>
      <Editor
        theme={theme}  
        language={language}
        value={code}
        onMount={(editor) => (editorRef.current = editor)}
        onChange={(value) => setCode(value)}
        options={{
          fontSize: 14, 
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>

   
    <p>{output}</p>
  </div>
</Splitter.Panel>


              <Splitter.Panel style={{ padding: "10px", height: "50%", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <div className="test-cases-block" style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  <Typography.Title level={5} style={{ textAlign: "center" }}>Test Cases</Typography.Title>
                  <div style={{ flexGrow: 1, overflow: "auto" }}>
                    {problem?.testCases && Array.isArray(problem.testCases) && problem.testCases.length > 0 ? (
                      <pre style={{ background: "#eef", padding: "10px", borderRadius: "5px" }}>
                        {problem.testCases.map((tc, index) => (
                          <div key={index}>
                            <strong>Input:</strong> {tc.input} <br />
                            <strong>Expected Output:</strong> {tc.expectedOutput} <br />
                            <hr />
                          </div>
                        ))}
                      </pre>
                    ) : (
                      <p>No test cases available.</p>
                    )}
                  </div>
                </div>
              </Splitter.Panel>
            </Splitter>
          </Splitter.Panel>
        </Splitter>
      </Layout>
    </div>
  );
}