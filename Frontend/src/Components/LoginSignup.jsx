import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import gsap from "gsap";
import "../Utils/LoginSignup.css"; 
import SSSIHL from "../img/SSSIHL.png";

<<<<<<< HEAD
const API_URL = "http://localhost:5000";
=======
const API_URL = "http://localhost:5000/api/auth";
>>>>>>> master

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
<<<<<<< HEAD
            alert("Signup Successful");
            console.log(response.data);
        } catch (error) {
            console.error("Signup Error:", error.response.data.message);
            alert(error.response.data.message);
        }
    };

=======
            localStorage.setItem("authToken", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            navigate("/dashboard");  // ✅ Navigate immediately after successful signup
        } catch (error) {
            console.error("Signup Error:", error.response?.data?.message || error.message);
            alert(error.response?.data?.message || "Signup failed");
        }
    };
    
>>>>>>> master
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/login`, loginData);
<<<<<<< HEAD
            alert("Login Successful");
            localStorage.setItem("authToken", response.data.token);
            navigate("/dashboard"); 
        } catch (error) {
            console.error("Login Error:", error.response.data.message);
            alert(error.response.data.message);
        }
    };
=======
            localStorage.setItem("authToken", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            navigate("/dashboard");  // ✅ Navigate immediately after successful login
        } catch (error) {
            console.error("Login Error:", error.response?.data?.message || error.message);
            alert(error.response?.data?.message || "Login failed");
        }
    };
    
>>>>>>> master

    return (
        <div className={`container ${isSignup ? "signup" : ""}`}>
            <div className="shape">
                <img className="img0" src={SSSIHL} alt="sssihl" />
<<<<<<< HEAD
                <p className="h1">
                {isSignup ? "Already have an account? " : "Don't have an account?"}   
                </p>
                <p className="toggle" onClick={() => setIsSignup(!isSignup)}>
                    {isSignup ? " Login" : " Sign up"}
                </p>
            </div>
            <div className="forms">
                
=======
                <p className="h1">{isSignup ? "Don't have an account?":"Already have an account?" }</p>
                <p className="toggle" onClick={() => setIsSignup(!isSignup)}>
                    {isSignup ? "Sign up":"Login" }
                </p>
            </div>
            <div className="forms">
>>>>>>> master
                <form className="form login" onSubmit={handleLoginSubmit}>
                    <h2>Login</h2>
                    <input type="email" name="email" placeholder="Email" required value={loginData.email} onChange={handleLoginChange} />
                    <input type="password" name="password" placeholder="Password" required value={loginData.password} onChange={handleLoginChange} />
                    <button type="submit">Login</button>
                </form>

<<<<<<< HEAD
              
=======
>>>>>>> master
                <form className="form signup" onSubmit={handleSignupSubmit}>
                    <h2>Sign Up</h2>
                    <input type="text" name="username" placeholder="Username" required value={signupData.username} onChange={handleSignupChange} />
                    <input type="email" name="email" placeholder="Email" required value={signupData.email} onChange={handleSignupChange} />
                    <input type="password" name="password" placeholder="Password" required value={signupData.password} onChange={handleSignupChange} />
                    <button type="submit">Sign Up</button>
                </form>
            </div>
        </div>
    );
};

export default LoginSignup;
