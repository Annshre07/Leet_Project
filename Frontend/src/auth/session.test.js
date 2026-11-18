import { tokenExpired, homeFor, getUser, setSession, clearSession, isAuthenticated } from "./session";

const jwt = (payload) => `x.${btoa(JSON.stringify(payload)).replace(/=+$/, "")}.y`;

beforeEach(() => localStorage.clear());

test("tokenExpired", () => {
  expect(tokenExpired(null)).toBe(true);
  expect(tokenExpired("garbage")).toBe(true);
  expect(tokenExpired(jwt({ exp: Math.floor(Date.now() / 1000) - 5 }))).toBe(true);
  expect(tokenExpired(jwt({ exp: Math.floor(Date.now() / 1000) + 500 }))).toBe(false);
});

test("session lifecycle", () => {
  const token = jwt({ exp: Math.floor(Date.now() / 1000) + 500 });
  setSession({ token, user: { id: "1", role: "teacher" } });
  expect(isAuthenticated()).toBe(true);
  expect(homeFor(getUser())).toBe("/admin-dashboard");
  clearSession();
  expect(getUser()).toBeNull();
  expect(isAuthenticated()).toBe(false);
});

test("homeFor sends students to the student dashboard", () => {
  expect(homeFor({ role: "student" })).toBe("/Dashboard");
  expect(homeFor(null)).toBe("/Dashboard");
});
