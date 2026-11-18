import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TextField, Select, MenuItem, Alert } from "@mui/material";
import api, { errorMessage } from "../api/client";
import { getUser } from "../auth/session";
import "../Utils/AdminProfile.css";

const ROLES = ["student", "teacher", "admin"];

const AdminProfile = () => {
  const me = getUser();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/admin/users", { params: { page: page + 1, limit: rowsPerPage, search: query || undefined } });
      setRows(data.items);
      setTotal(data.total);
      setError("");
    } catch (e) {
      setError(errorMessage(e, "Could not load users"));
    }
  }, [page, rowsPerPage, query]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn, okText) => {
    try { await fn(); setNotice(okText); setError(""); await load(); }
    catch (e) { setNotice(""); setError(errorMessage(e)); }
  };
  const setRole = (u, role) => act(() => api.patch(`/api/admin/users/${u._id}/role`, { role }), `${u.username} is now ${role}`);
  const setActive = (u, isActive) => act(() => api.patch(`/api/admin/users/${u._id}/active`, { isActive }), `${u.username} ${isActive ? "activated" : "deactivated"}`);

  return (
    <div className="admin-container">
      <h2 className="admin-title">Admin Profile</h2>
      <div className="admin-info">
        <p><strong>Username:</strong> {me?.username}</p>
        <p><strong>Email:</strong> {me?.email}</p>
        <p><strong>Role:</strong> {me?.role}</p>
      </div>

      <h3 className="admin-title">Users</h3>
      <form onSubmit={(e) => { e.preventDefault(); setPage(0); setQuery(search.trim()); }} style={{ display: "flex", gap: 8, margin: "8px 0" }}>
        <TextField size="small" label="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="contained">Search</Button>
      </form>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 1 }}>{notice}</Alert>}

      <TableContainer component={Paper} className="table-container">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["Username", "Email", "Role", "Status", "Actions"].map((h) => <TableCell key={h} className="table-header">{h}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((u) => {
              const isMe = u._id === me?.id;
              return (
                <TableRow key={u._id} className="table-row">
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select size="small" value={u.role} disabled={isMe} onChange={(e) => setRole(u, e.target.value)} inputProps={{ "aria-label": `Role of ${u.username}` }}>
                      {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell>{u.isActive ? "Active" : "Deactivated"}</TableCell>
                  <TableCell>
                    <Button size="small" disabled={isMe} onClick={() => setActive(u, !u.isActive)}>{u.isActive ? "Deactivate" : "Activate"}</Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && <TableRow><TableCell colSpan={5}>No users found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination className="pagination" rowsPerPageOptions={[5, 10, 25, 50]} component="div" count={total} rowsPerPage={rowsPerPage} page={page}
        onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }} />

      <button className="back-btn" onClick={() => navigate("/admin-dashboard")}>Back to Dashboard</button>
    </div>
  );
};

export default AdminProfile;
