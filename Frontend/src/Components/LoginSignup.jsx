import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import gsap from "gsap";
import api, { errorMessage } from "../api/client";
import { setSession, isAuthenticated, getUser, homeFor } from "../auth/session";
import "../Utils/LoginSignup.css";
import SSSIHL from "../img/SSSIHL.png";

const PASSWORD_HINT = "At least 8 characters, with a letter and a number";

const LoginSignup = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signupData, setSignupData] = useState({ username: "", email: "", password: "" });
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  useEffect(() => {
    api.get("/api/auth/config").then((r) => setSignupEnabled(!!r.data.signupEnabled)).catch(() => {});
  }, []);

  useEffect(() => {
    gsap.to(".shape", {
      left: isSignup ? "50%" : "0%",
      borderTopLeftRadius: isSignup ? "300px" : "0px",
      borderBottomLeftRadius: isSignup ? "300px" : "0px",
      borderTopRightRadius: isSignup ? "0px" : "300px",
      borderBottomRightRadius: isSignup ? "0px" : "300px",
      duration: 0.5,
      ease: "power2.inOut",
    });
  }, [isSignup]);

  if (isAuthenticated()) return <Navigate to={homeFor(getUser())} replace />;

  const submit = (path, data) => async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data: res } = await api.post(`/api/auth/${path}`, data);
      setSession(res);
      navigate(homeFor(res.user), { replace: true });
    } catch (err) {
      setError(errorMessage(err, path === "login" ? "Login failed" : "Signup failed"));
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => { setError(""); setIsSignup(!isSignup); };

  return (
    <div className="main">
      <h2 className="pos">ONLINE LAB TEST</h2>
      <div className="login-signup">
        <div className={`container ${isSignup ? "signup" : ""}`}>
          <div className="shape">
            <img className="img0" src={SSSIHL} alt="sssihl" />
            {signupEnabled ? (
              <>
                <p className="h1">{isSignup ? "Already have an account?" : "Don't have an account?"}</p>
                <p className="toggle" onClick={toggle}>{isSignup ? "Login" : "Sign up"}</p>
              </>
            ) : (
              <p className="h1">Accounts are created by your administrator</p>
            )}
          </div>
          <div className="forms">
            <form className="form login" onSubmit={submit("login", loginData)}>
              <h2>Login</h2>
              <input type="email" name="email" placeholder="Email" required autoComplete="username" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
              <input type="password" name="password" placeholder="Password" required autoComplete="current-password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
              {!isSignup && error && <p role="alert" style={{ color: "#c0392b", margin: 0 }}>{error}</p>}
              <button type="submit" disabled={busy}>{busy && !isSignup ? "Signing in…" : "Login"}</button>
            </form>

            {signupEnabled && (
              <form className="form signup" onSubmit={submit("signup", signupData)}>
                <h2>Sign Up</h2>
                <input type="text" name="username" placeholder="Username" required minLength={2} autoComplete="name" value={signupData.username} onChange={(e) => setSignupData({ ...signupData, username: e.target.value })} />
                <input type="email" name="email" placeholder="Email" required autoComplete="email" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} />
                <input type="password" name="password" placeholder="Password" required minLength={8} title={PASSWORD_HINT} autoComplete="new-password" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} />
                <small style={{ color: "#667" }}>{PASSWORD_HINT}</small>
                {isSignup && error && <p role="alert" style={{ color: "#c0392b", margin: 0 }}>{error}</p>}
                <button type="submit" disabled={busy}>{busy && isSignup ? "Creating…" : "Sign Up"}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
