import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Dialog, DialogActions,
  DialogContent, DialogTitle, MenuItem, Checkbox, FormControlLabel, Alert, IconButton, Stack,
} from "@mui/material";
import api, { errorMessage } from "../api/client";
import { getUser } from "../auth/session";

const emptyTest = () => ({ input: "", expectedOutput: "", hidden: false, weight: 1 });
const emptyForm = () => ({
  title: "", question: "", description: "", difficulty: "Easy", deadline: "", tags: "",
  timeLimitMs: 2000, memoryLimitMb: 256, compareMode: "trimmed", testCases: [emptyTest()],
});

export default function Question() {
  const navigate = useNavigate();
  const me = getUser();
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get("/api/questions").then((r) => { setQuestions(r.data); setError(""); }).catch((e) => setError(errorMessage(e, "Could not load questions")));
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const setTest = (i, patch) => setForm((f) => ({ ...f, testCases: f.testCases.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setFormError(""); setOpen(true); };
  const openEdit = async (id) => {
    try {
      const { data } = await api.get(`/api/questions/${id}`);
      setEditingId(id);
      setForm({
        title: data.title, question: data.question, description: data.description, difficulty: data.difficulty,
        deadline: data.deadline || "", tags: (data.tags || []).join(", "), timeLimitMs: data.timeLimitMs, memoryLimitMb: data.memoryLimitMb,
        compareMode: data.compareMode || "trimmed",
        testCases: data.testCases.length ? data.testCases.map((t) => ({ input: t.input, expectedOutput: t.expectedOutput, hidden: !!t.hidden, weight: t.weight ?? 1 })) : [emptyTest()],
      });
      setFormError("");
      setOpen(true);
    } catch (e) { setError(errorMessage(e)); }
  };

  const save = async () => {
    const payload = {
      title: form.title.trim(), question: form.question.trim(), description: form.description.trim(), difficulty: form.difficulty,
      deadline: form.deadline || null, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      timeLimitMs: Number(form.timeLimitMs), memoryLimitMb: Number(form.memoryLimitMb), compareMode: form.compareMode,
      testCases: form.testCases.map((t) => ({ ...t, weight: Number(t.weight) })),
    };
    setSaving(true);
    try {
      if (editingId) await api.put(`/api/questions/${editingId}`, payload);
      else await api.post("/api/questions", payload);
      setOpen(false);
      load();
    } catch (e) { setFormError(errorMessage(e, "Could not save the question")); }
    finally { setSaving(false); }
  };

  const remove = async (q) => {
    if (!window.confirm(`Delete "${q.title}"?`)) return;
    try {
      await api.delete(`/api/questions/${q._id}`);
    } catch (e) {
      if (e.response?.status === 409 && window.confirm(`${e.response.data.message}\n\nDelete the question and its submissions?`)) {
        try { await api.delete(`/api/questions/${q._id}`, { params: { force: true } }); } catch (e2) { setError(errorMessage(e2)); return; }
      } else { if (e.response?.status !== 409) setError(errorMessage(e)); return; }
    }
    load();
  };

  const canManage = (q) => me?.role === "admin" || (me?.role === "teacher"); // the API still restricts teachers to problems they created

  return (
    <Paper sx={{ width: "100%", overflow: "hidden", padding: 2 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button variant="contained" onClick={openCreate}>Add Question</Button>
        <Button onClick={() => navigate("/admin-dashboard")}>Back</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError("")}>{error}</Alert>}

      {questions.length === 0 ? <p>No questions yet.</p> : (
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="question table">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell align="right">Difficulty</TableCell>
                <TableCell align="right">Deadline</TableCell>
                <TableCell align="right">Tests</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((q) => (
                <TableRow hover key={q._id} sx={{ cursor: "pointer" }} onClick={() => navigate("/admin-dashboard/Question/Problem", { state: { id: q._id, title: q.title } })}>
                  <TableCell>{q.title}</TableCell>
                  <TableCell align="right">{q.difficulty}</TableCell>
                  <TableCell align="right">{q.deadline || "No deadline"}</TableCell>
                  <TableCell align="right">{q.testCaseCount}</TableCell>
                  <TableCell>
                    {canManage(q) && <Button size="small" onClick={(e) => { e.stopPropagation(); openEdit(q._id); }}>Edit</Button>}
                    {me?.role === "admin" && <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); remove(q); }}>Delete</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={questions.length} rowsPerPage={rowsPerPage} page={page}
        onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }} />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? "Edit Question" : "Add New Question"}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 1 }}>{formError}</Alert>}
          <TextField margin="dense" label="Title" fullWidth required value={form.title} onChange={(e) => set("title", e.target.value)} />
          <TextField margin="dense" label="Question (problem statement)" fullWidth multiline rows={3} required value={form.question} onChange={(e) => set("question", e.target.value)} />
          <TextField margin="dense" label="Description (input/output format, constraints)" fullWidth multiline rows={3} required value={form.description} onChange={(e) => set("description", e.target.value)} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField margin="dense" select label="Difficulty" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} sx={{ minWidth: 140 }}>
              {["Easy", "Medium", "Hard"].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
            <TextField margin="dense" type="date" label="Deadline (optional)" InputLabelProps={{ shrink: true }} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
            <TextField margin="dense" label="Tags (comma separated)" fullWidth value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField margin="dense" type="number" label="Time limit (ms)" value={form.timeLimitMs} onChange={(e) => set("timeLimitMs", e.target.value)} inputProps={{ min: 100, max: 15000 }} />
            <TextField margin="dense" type="number" label="Memory limit (MB)" value={form.memoryLimitMb} onChange={(e) => set("memoryLimitMb", e.target.value)} inputProps={{ min: 16, max: 1024 }} />
            <TextField margin="dense" select label="Output comparison" value={form.compareMode} onChange={(e) => set("compareMode", e.target.value)} sx={{ minWidth: 260 }}
              helperText="Trimmed ignores trailing spaces/blank lines; tokens ignores all whitespace">
              <MenuItem value="trimmed">Trimmed lines</MenuItem>
              <MenuItem value="tokens">Whitespace-insensitive tokens</MenuItem>
            </TextField>
          </Stack>

          <h4 style={{ marginBottom: 0 }}>Test cases</h4>
          <small>Hidden cases are used for grading only and are never shown to students.</small>
          {form.testCases.map((t, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 1.5, mt: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <strong>Case {i + 1}</strong>
                <FormControlLabel control={<Checkbox checked={t.hidden} onChange={(e) => setTest(i, { hidden: e.target.checked })} />} label="Hidden" />
                <TextField size="small" type="number" label="Weight" value={t.weight} onChange={(e) => setTest(i, { weight: e.target.value })} inputProps={{ min: 0, step: "any" }} sx={{ width: 100 }} />
                <span style={{ flexGrow: 1 }} />
                <IconButton aria-label={`Remove case ${i + 1}`} disabled={form.testCases.length === 1} onClick={() => set("testCases", form.testCases.filter((_, k) => k !== i))}>✕</IconButton>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField label="Input (stdin)" fullWidth multiline minRows={2} value={t.input} onChange={(e) => setTest(i, { input: e.target.value })} inputProps={{ style: { fontFamily: "monospace" } }} />
                <TextField label="Expected output" fullWidth multiline minRows={2} required value={t.expectedOutput} onChange={(e) => setTest(i, { expectedOutput: e.target.value })} inputProps={{ style: { fontFamily: "monospace" } }} />
              </Stack>
            </Paper>
          ))}
          <Button variant="outlined" onClick={() => set("testCases", [...form.testCases, emptyTest()])} sx={{ mt: 1.5 }}>+ Add test case</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={save} variant="contained" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Add"}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
