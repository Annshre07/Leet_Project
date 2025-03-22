const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/authMiddleware");


require("dotenv").config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

// Signup Route
router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        // ✅ If it's the first admin, set role to "admin"
        let role = "user";  // Default role
        if (email === "sashankcherukuri7@gmail.com") {
            const adminExists = await User.findOne({ role: "admin" });
            if (!adminExists) {
                role = "admin"; // Make the first admin
            }
        }

        const newUser = new User({ username, email, password, role });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: "1h" });
        res.status(201).json({ message: "Signup successful", token, user: { id: newUser._id, username, email, role } });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// Login Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "Login successful", token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// Promote to Admin Route
router.post("/promote", authMiddleware, async (req, res) => {
    try {
        const { userId } = req.body;
        const adminEmail = "sashankcherukuri7@gmail.com";

        const requestingUser = await User.findById(req.user.id);
        if (requestingUser.email !== adminEmail) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.role = "admin";
        await user.save();

        res.json({ message: "User promoted to admin" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
