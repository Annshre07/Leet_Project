import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Utils/Profile.css"; // Import CSS file

const Profile = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
            navigate("/login"); // Redirect if not logged in
            return;
        }
        setUser(storedUser);
    }, [navigate]);

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
        </div>
    );
};

export default Profile;
