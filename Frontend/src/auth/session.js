const TOKEN_KEY = "authToken";
const USER_KEY = "user";

const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };

export const getToken = () => safe(() => localStorage.getItem(TOKEN_KEY));
export const getUser = () => safe(() => JSON.parse(localStorage.getItem(USER_KEY)));

export const setSession = ({ token, user }) => safe(() => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
});

export const clearSession = () => safe(() => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
});

export const tokenExpired = (token) => {
  if (!token) return true;
  return safe(() => {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  }, true);
};

export const isAuthenticated = () => !tokenExpired(getToken()) && !!getUser();

// Display/routing only. The server decides what each role may actually do.
export const homeFor = (user) => (user?.role === "admin" || user?.role === "teacher" ? "/admin-dashboard" : "/Dashboard");
