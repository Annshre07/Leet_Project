const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticateAdmin } = require("../middleware/authMiddleware");

// Fetch all users (Only Admins)
router.get("/users", authenticateAdmin, async (req, res) => {
    try {
        const users = await User.find({}, "-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

// Promote user to admin
router.post("/auth/promote", authenticateAdmin, async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.role = "admin";
        await user.save();

        res.json({ message: "User promoted to admin" });
    } catch (err) {
        res.status(500).json({ message: "Error promoting user" });
    }
});

module.exports = router;
