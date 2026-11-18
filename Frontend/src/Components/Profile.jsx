import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api/client";
import { getUser, setSession, homeFor } from "../auth/session";
import "../Utils/Profile.css";

const Profile = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return setStatus({ type: "error", text: "New passwords do not match" });
    setBusy(true);
    try {
      const { data } = await api.post("/api/auth/change-password", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSession(data); // the old token is invalid after a password change
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setStatus({ type: "ok", text: "Password changed" });
    } catch (err) {
      setStatus({ type: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };
  const field = (name, label) => (
    <label style={{ display: "block", marginTop: 8 }}>
      {label}
      <input type="password" required value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} autoComplete={name === "currentPassword" ? "current-password" : "new-password"} style={{ display: "block", width: "100%", padding: 6 }} />
    </label>
  );

  return (
    <div className="profile-container">
      <h1 className="profile-header">Profile</h1>
      {user && (
        <div className="profile-details">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
      )}
      <form onSubmit={submit} className="profile-details" style={{ marginTop: 24 }}>
        <h3>Change password</h3>
        {field("currentPassword", "Current password")}
        {field("newPassword", "New password (8+ characters, a letter and a number)")}
        {field("confirm", "Confirm new password")}
        {status.text && <p role="status" style={{ color: status.type === "ok" ? "green" : "#c0392b" }}>{status.text}</p>}
        <button type="submit" disabled={busy} style={{ marginTop: 8 }}>{busy ? "Saving…" : "Change password"}</button>
        <button type="button" onClick={() => navigate(homeFor(user))} style={{ marginTop: 8, marginLeft: 8 }}>Back</button>
      </form>
    </div>
  );
};

export default Profile;
