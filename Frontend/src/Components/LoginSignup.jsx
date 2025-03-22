import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import gsap from "gsap";
import "../Utils/LoginSignup.css"; 
import SSSIHL from "../img/SSSIHL.png";

const API_URL = "http://localhost:5000/api/auth";

const LoginSignup = () => {
    const navigate = useNavigate();
    const [isSignup, setIsSignup] = useState(false);
    const [signupData, setSignupData] = useState({ username: "", email: "", password: "" });
    const [loginData, setLoginData] = useState({ email: "", password: "" });

    useEffect(() => {
        gsap.to(".shape", {
            left: isSignup ? "50%" : "0%",
            borderTopLeftRadius: isSignup ? "300px" : "0px",
            borderBottomLeftRadius: isSignup ? "300px" : "0px",
            borderTopRightRadius: isSignup ? "0px" : "300px",
            borderBottomRightRadius: isSignup ? "0px" : "300px",
            duration: 0.5,
            ease: "power2.inOut"
        });
    }, [isSignup]);

    const handleSignupChange = (e) => setSignupData({ ...signupData, [e.target.name]: e.target.value });
    const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/signup`, signupData);
            const user = response.data.user;

            localStorage.setItem("authToken", response.data.token);
            localStorage.setItem("user", JSON.stringify(user));

            navigate(user.role === "admin" ? "/admin-dashboard" : "/Dashboard"); // ✅ Redirect based on role
        } catch (error) {
            console.error("Signup Error:", error.response?.data?.message || error.message);
            alert(error.response?.data?.message || "Signup failed");
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/login`, loginData);
            const user = response.data.user;

            localStorage.setItem("authToken", response.data.token);
            localStorage.setItem("user", JSON.stringify(user));

            navigate(user.role === "admin" ? "/admin-dashboard" : "/Dashboard"); // ✅ Redirect based on role
        } catch (error) {
            console.error("Login Error:", error.response?.data?.message || error.message);
            alert(error.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="main">
            <h2 className="pos">ONLINE LAB TEST</h2>
            <div className="login-signup">
                <div className={`container ${isSignup ? "signup" : ""}`}>
                    <div className="shape">
                        <img className="img0" src={SSSIHL} alt="sssihl" />
                        <p className="h1">{isSignup ? "Don't have an account?" : "Already have an account?"}</p>
                        <p className="toggle" onClick={() => setIsSignup(!isSignup)}>
                            {isSignup ? "Sign up" : "Login"}
                        </p>
                    </div>
                    <div className="forms">
                        <form className="form login" onSubmit={handleLoginSubmit}>
                            <h2>Login</h2>
                            <input type="email" name="email" placeholder="Email" required value={loginData.email} onChange={handleLoginChange} />
                            <input type="password" name="password" placeholder="Password" required value={loginData.password} onChange={handleLoginChange} />
                            <button type="submit">Login</button>
                        </form>

                        <form className="form signup" onSubmit={handleSignupSubmit}>
                            <h2>Sign Up</h2>
                            <input type="text" name="username" placeholder="Username" required value={signupData.username} onChange={handleSignupChange} />
                            <input type="email" name="email" placeholder="Email" required value={signupData.email} onChange={handleSignupChange} />
                            <input type="password" name="password" placeholder="Password" required value={signupData.password} onChange={handleSignupChange} />
                            <button type="submit">Sign Up</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginSignup;
