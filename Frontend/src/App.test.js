import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute";
import LoginSignup from "./Components/LoginSignup";
import App from "./App";

const makeToken = (expSecondsFromNow) => {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "HS256" })}.${b64({ id: "1", exp: Math.floor(Date.now() / 1000) + expSecondsFromNow })}.sig`;
};
const signIn = (role, expIn = 3600) => {
  localStorage.setItem("authToken", makeToken(expIn));
  localStorage.setItem("user", JSON.stringify({ id: "1", username: "u", email: "u@example.com", role }));
};

jest.mock("./api/client", () => {
  const api = { get: jest.fn(() => Promise.resolve({ data: { signupEnabled: true } })), post: jest.fn() };
  return { __esModule: true, default: api, errorMessage: (e) => e.message, API_URL: "http://test" };
});

const guarded = (roles, initial) => (
  <MemoryRouter initialEntries={[initial]}>
    <Routes>
      <Route path="/" element={<div>login page</div>} />
      <Route path="/Dashboard" element={<div>student home</div>} />
      <Route element={<ProtectedRoute roles={roles} />}>
        <Route path="/secret" element={<div>secret content</div>} />
      </Route>
    </Routes>
  </MemoryRouter>
);

// CRA runs Jest with resetMocks, so the default API stub is re-applied before every test.
beforeEach(() => {
  localStorage.clear();
  require("./api/client").default.get.mockResolvedValue({ data: { signupEnabled: true } });
});

test("signed-out visitors are sent to the login page", () => {
  render(guarded(undefined, "/secret"));
  expect(screen.getByText("login page")).toBeInTheDocument();
});

test("an expired token counts as signed out and is cleared", () => {
  signIn("student", -60);
  render(guarded(undefined, "/secret"));
  expect(screen.getByText("login page")).toBeInTheDocument();
  expect(localStorage.getItem("authToken")).toBeNull();
});

test("a student cannot open an admin-only route, even with a forged role in storage being checked only for UX", () => {
  signIn("student");
  render(guarded(["admin"], "/secret"));
  expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  expect(screen.getByText("student home")).toBeInTheDocument();
});

test("an admin can open an admin-only route", () => {
  signIn("admin");
  render(guarded(["admin"], "/secret"));
  expect(screen.getByText("secret content")).toBeInTheDocument();
});

test("the app shows the login form first", async () => {
  render(<App />);
  expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
  expect(screen.getAllByPlaceholderText("Email").length).toBeGreaterThan(0);
});

test("login screen hides sign-up when the server disables self-registration", async () => {
  const api = require("./api/client").default;
  api.get.mockResolvedValueOnce({ data: { signupEnabled: false } });
  render(<MemoryRouter><LoginSignup /></MemoryRouter>);
  expect(await screen.findByText(/created by your administrator/i)).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Sign Up" })).not.toBeInTheDocument();
});
