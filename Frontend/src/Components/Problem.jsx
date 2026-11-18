import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout, Typography, Button, Modal, Splitter, Tabs, Tag, Alert, Table, Spin } from "antd";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { Editor, loader } from "@monaco-editor/react";
import api, { errorMessage } from "../api/client";
import { getUser, homeFor } from "../auth/session";
import Description from "./Description";
import Submission, { verdictColor } from "./Submission";
import "../Utils/Problem.css";

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

const OutputBlock = ({ title, text, color }) =>
  text ? (
    <div style={{ marginTop: 8 }}>
      <strong>{title}</strong>
      <pre style={{ background: color || "#f5f5f5", padding: 8, borderRadius: 4, maxHeight: 180, overflow: "auto", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{text}</pre>
    </div>
  ) : null;

export default function Problem() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const isStaff = user?.role === "admin" || user?.role === "teacher";

  const [problems, setProblems] = useState([]);
  const [problem, setProblem] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [languages, setLanguages] = useState(null); // null = loading
  const [language, setLanguage] = useState(store.get("labyrinth:lang") || "cpp");
  const [code, setCode] = useState("");
  const [theme, setTheme] = useState("myDarkTheme");
  const [fontSize, setFontSize] = useState(14);
  const [selectedTab, setSelectedTab] = useState("description");
  const [bottomTab, setBottomTab] = useState("samples");
  const [customInput, setCustomInput] = useState("");
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Stopwatch and notes (local conveniences)
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const problemId = problem?._id;
  const langInfo = useMemo(() => languages?.find((l) => l.id === language), [languages, language]);
  const codeKey = problemId ? `labyrinth:code:${problemId}:${language}` : null;

  // ---- load data ----
  const loadProblem = useCallback(async (key) => {
    setLoadError("");
    try {
      const { data } = await api.get(`/api/questions/${encodeURIComponent(key)}`);
      setProblem(data);
      setRunResult(null);
      setSubmitResult(null);
      setActionError("");
      setCustomInput(data.testCases?.[0]?.input ?? "");
      setNotes(store.get(`labyrinth:notes:${data._id}`) || "");
    } catch (e) {
      setLoadError(errorMessage(e, "Could not load this problem"));
    }
  }, []);

  useEffect(() => {
    const key = location.state?.id || location.state?.title;
    if (!key) { navigate(homeFor(user), { replace: true }); return; }
    loadProblem(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.id, location.state?.title]);

  useEffect(() => {
    api.get("/api/questions").then((r) => setProblems(r.data)).catch(() => {});
    api.get("/api/judge/languages")
      .then((r) => {
        setLanguages(r.data.languages);
        if (r.data.languages.length && !r.data.languages.some((l) => l.id === language)) setLanguage(r.data.languages[0].id);
      })
      .catch(() => setLanguages([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore saved code (or the language template) when the problem or language changes
  useEffect(() => {
    if (!codeKey || !langInfo) return;
    setCode(store.get(codeKey) ?? langInfo.template);
  }, [codeKey, langInfo]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const id = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    loader.init().then((monaco) => {
      monaco.editor.defineTheme("myDarkTheme", { base: "vs-dark", inherit: true, rules: [{ token: "comment", foreground: "ffa500", fontStyle: "italic" }],
        colors: { "editor.foreground": "#ffffff", "editor.background": "#1e1e1e", "editorCursor.foreground": "#ffcc00", "editor.lineHighlightBackground": "#2c313a", "editor.selectionBackground": "#3e4451" } });
      monaco.editor.defineTheme("myLightTheme", { base: "vs", inherit: true, rules: [{ token: "comment", foreground: "008000", fontStyle: "italic" }],
        colors: { "editor.foreground": "#000000", "editor.background": "#f5f5f5", "editorCursor.foreground": "#ff0000", "editor.lineHighlightBackground": "#e8e8e8", "editor.selectionBackground": "#d6d6d6" } });
    }).catch(() => {});
  }, []);

  // ---- actions ----
  const onCodeChange = (value) => {
    const v = value ?? "";
    setCode(v);
    if (codeKey) store.set(codeKey, v);
  };
  const changeLanguage = (id) => { setLanguage(id); store.set("labyrinth:lang", id); };

  const run = async () => {
    setRunning(true); setActionError(""); setBottomTab("custom");
    try {
      const { data } = await api.post("/api/judge/run", { language, code, input: customInput, questionId: problemId });
      setRunResult(data);
    } catch (e) { setRunResult(null); setActionError(errorMessage(e)); }
    finally { setRunning(false); }
  };

  const submit = async () => {
    setSubmitting(true); setActionError(""); setBottomTab("result");
    try {
      const { data } = await api.post("/api/submissions", { questionId: problemId, language, code });
      setSubmitResult(data);
      setRefreshTrigger((n) => n + 1);
    } catch (e) { setSubmitResult(null); setActionError(errorMessage(e)); }
    finally { setSubmitting(false); }
  };

  const executionUnavailable = languages !== null && languages.length === 0;
  const expired = !!problem?.expired && !isStaff;
  const canAct = !!problem && !!langInfo && !running && !submitting;

  // ---- UI pieces ----
  const samples = (problem?.testCases || []).filter((t) => !t.hidden);
  const samplesTab = (
    <div style={{ overflow: "auto", height: "100%" }}>
      {samples.length === 0 && <p>No sample cases are published for this problem.</p>}
      {samples.map((t, i) => (
        <div key={i} style={{ marginBottom: 10, background: "#eef", padding: 8, borderRadius: 4 }}>
          <strong>Sample {i + 1}</strong>{" "}
          <Button size="small" onClick={() => { setCustomInput(t.input); setBottomTab("custom"); }}>Use as custom input</Button>
          <OutputBlock title="Input" text={t.input === "" ? "(empty)" : t.input} color="#fff" />
          <OutputBlock title="Expected output" text={t.expectedOutput} color="#fff" />
        </div>
      ))}
      {problem?.hiddenTestCount > 0 && <p style={{ color: "#666" }}>{problem.hiddenTestCount} more hidden test case(s) are used when you submit.</p>}
    </div>
  );

  const customTab = (
    <div style={{ overflow: "auto", height: "100%" }}>
      <label htmlFor="custom-input"><strong>Custom input (stdin)</strong></label>
      <textarea id="custom-input" value={customInput} onChange={(e) => setCustomInput(e.target.value)} rows={4} spellCheck={false}
        style={{ width: "100%", fontFamily: "monospace", padding: 6, boxSizing: "border-box" }} />
      {running && <Spin style={{ display: "block", margin: 8 }} />}
      {runResult && (
        <div>
          <p style={{ margin: "8px 0 0" }}>
            <Tag color={runResult.verdict === "Completed" ? "green" : verdictColor(runResult.verdict)}>{runResult.verdict}</Tag>
            {runResult.verdict !== "Compilation Error" && <span>{runResult.timeMs} ms · {runResult.memoryKb} KB</span>}
          </p>
          <OutputBlock title="Compiler output" text={runResult.compileOutput} color="#fff4f0" />
          <OutputBlock title="Output" text={runResult.stdout} />
          <OutputBlock title="Errors" text={runResult.stderr} color="#fff4f0" />
        </div>
      )}
    </div>
  );

  const resultColumns = [
    { title: "Case", dataIndex: "index", render: (i, r) => `${r.hidden ? "Hidden" : "Sample"} ${i + 1}` },
    { title: "Verdict", dataIndex: "verdict", render: (v) => <Tag color={verdictColor(v)}>{v}</Tag> },
    { title: "Time", dataIndex: "timeMs", render: (t) => `${t} ms` },
    { title: "Memory", dataIndex: "memoryKb", render: (m) => `${m} KB` },
  ];
  const resultTab = (
    <div style={{ overflow: "auto", height: "100%" }}>
      {submitting && <Spin style={{ display: "block", margin: 8 }} />}
      {!submitting && !submitResult && <p>Submit your solution to see results here.</p>}
      {submitResult && (
        <div>
          <h4 style={{ margin: "0 0 6px" }}>
            <Tag color={verdictColor(submitResult.verdict)} style={{ fontSize: 14 }}>{submitResult.verdict}</Tag>
            {submitResult.totalCount > 0 && <span>{submitResult.passedCount}/{submitResult.totalCount} cases · score {submitResult.score}%</span>}
          </h4>
          <OutputBlock title="Compiler output" text={submitResult.compileOutput} color="#fff4f0" />
          {submitResult.results?.length > 0 && <Table size="small" pagination={false} rowKey="index" columns={resultColumns} dataSource={submitResult.results} />}
          {(submitResult.sampleDetails || []).filter((d) => submitResult.results?.[d.index]?.verdict !== "Accepted").map((d) => (
            <div key={d.index}>
              <OutputBlock title={`Sample ${d.index + 1} output`} text={d.stdout} />
              <OutputBlock title={`Sample ${d.index + 1} errors`} text={d.stderr} color="#fff4f0" />
            </div>
          ))}
          <p style={{ color: "#666", fontSize: 12, marginTop: 8 }}>Runtime and memory are measured on this server; they are not comparable with other machines.</p>
        </div>
      )}
    </div>
  );

  const leftTabs = {
    description: <Description problem={problem} />,
    submission: <Submission questionId={problemId} refreshTrigger={refreshTrigger} />,
  };

  return (
    <div className="Problem-Bar">
      <Layout style={{ height: "100vh", background: "#fff" }}>
        <div className="Buttons">
          <Button onClick={() => navigate(-1)}>Back</Button>
          <Button onClick={() => setDrawerOpen(true)}>Problem List</Button>
          <Button onClick={() => setIsNotesOpen(true)}>Note</Button>
          <div style={{ textAlign: "center", margin: 10, fontSize: 15, fontWeight: "bold" }}>
            <Button onClick={() => setIsRunning((p) => !p)} type="primary" style={{ marginRight: 5 }}>{isRunning ? "Stop" : "Start"}</Button>
            <Button onClick={() => { setIsRunning(false); setTime(0); }}>Reset</Button>
            {" "}Time: {Math.floor(time / 60)}:{("0" + (time % 60)).slice(-2)}
          </div>
          <Button onClick={run} disabled={!canAct || executionUnavailable} loading={running}>Run</Button>
          <Button type="primary" onClick={submit} disabled={!canAct || executionUnavailable || expired} loading={submitting}>Submit</Button>
        </div>

        <Modal title="Notes (saved in this browser)" open={isNotesOpen} onOk={() => setIsNotesOpen(false)} onCancel={() => setIsNotesOpen(false)}>
          <textarea value={notes} rows={5} placeholder="Write your notes here..." style={{ width: "100%", padding: 10 }}
            onChange={(e) => { setNotes(e.target.value); if (problemId) store.set(`labyrinth:notes:${problemId}`, e.target.value); }} />
        </Modal>

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 450 }} role="presentation">
            <List>
              {problems.length === 0 && <ListItem><ListItemText primary="No questions available." /></ListItem>}
              {problems.map((p) => (
                <ListItem key={p._id} disablePadding>
                  <ListItemButton onClick={() => { setDrawerOpen(false); navigate(location.pathname, { replace: true, state: { id: p._id, title: p.title } }); }}>
                    <ListItemText primary={p.title} secondary={p.difficulty} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {loadError && <Alert type="error" showIcon message={loadError} style={{ margin: 8 }} />}
        {executionUnavailable && <Alert type="warning" showIcon style={{ margin: 8 }} message="Code execution is not available on this server right now. Please contact your administrator." />}
        {expired && <Alert type="info" showIcon style={{ margin: 8 }} message="The deadline for this problem has passed. You can still run code, but submissions are closed." />}
        {actionError && <Alert type="error" showIcon closable message={actionError} onClose={() => setActionError("")} style={{ margin: 8 }} />}

        <Splitter style={{ height: "100%" }}>
          <Splitter.Panel style={{ borderRight: "1px solid #ddd", padding: 10, display: "flex", flexDirection: "column" }}>
            <Typography.Title level={4} style={{ textAlign: "center" }}>{problem?.title || "Loading…"}</Typography.Title>
            {problem && <p style={{ textAlign: "center", margin: 0 }}><Tag>{problem.difficulty}</Tag>{problem.deadline && <Tag>Due {problem.deadline}</Tag>}<Tag>{problem.timeLimitMs} ms</Tag><Tag>{problem.memoryLimitMb} MB</Tag></p>}
            <div className="options" style={{ marginTop: 10, display: "flex", justifyContent: "space-around" }}>
              {Object.keys(leftTabs).map((tab) => (
                <Button key={tab} type={selectedTab === tab ? "primary" : "default"} onClick={() => setSelectedTab(tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Button>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 10, border: "1px solid #ddd", borderRadius: 5, backgroundColor: "#f9f9f9", flexGrow: 1, overflow: "auto" }}>
              {leftTabs[selectedTab]}
            </div>
          </Splitter.Panel>

          <Splitter.Panel style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Splitter layout="vertical" style={{ height: "100%" }}>
              <Splitter.Panel style={{ padding: 10, display: "flex", flexDirection: "column" }}>
                <div className="coding-block" style={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <select aria-label="Language" value={language} onChange={(e) => changeLanguage(e.target.value)} className="language-dropdown" disabled={!languages?.length}>
                      {(languages || []).map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                    <select aria-label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
                      <option value="myDarkTheme">Dark Theme</option>
                      <option value="myLightTheme">Light Theme</option>
                    </select>
                    <select aria-label="Font size" value={fontSize} onChange={(e) => setFontSize(+e.target.value)}>
                      {[12, 14, 16, 18, 20].map((s) => <option key={s} value={s}>{s}px</option>)}
                    </select>
                    <Button size="small" onClick={() => langInfo && window.confirm("Replace your code with the starter template?") && onCodeChange(langInfo.template)}>Reset code</Button>
                  </div>
                  <div id="editor-container" style={{ flexGrow: 1, minHeight: 200, border: "1px solid #ddd" }}>
                    <Editor theme={theme} language={langInfo?.monaco || "plaintext"} value={code} onChange={onCodeChange}
                      options={{ fontSize, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4, bracketPairColorization: { enabled: true } }} />
                  </div>
                </div>
              </Splitter.Panel>
              <Splitter.Panel style={{ padding: 10 }}>
                <Tabs size="small" activeKey={bottomTab} onChange={setBottomTab} items={[
                  { key: "samples", label: "Samples", children: samplesTab },
                  { key: "custom", label: "Custom Input", children: customTab },
                  { key: "result", label: "Result", children: resultTab },
                ]} />
              </Splitter.Panel>
            </Splitter>
          </Splitter.Panel>
        </Splitter>
      </Layout>
    </div>
  );
}
