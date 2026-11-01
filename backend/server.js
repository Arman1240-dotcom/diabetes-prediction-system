
require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./models/User");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const assessmentRoutes = require("./routes/assessments");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/assessments", assessmentRoutes);
// Check MongoDB connection status
app.get("/api/health", (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;

    res.status(dbConnected ? 200 : 503).json({
        server: "running",
        database: dbConnected ? "connected" : "disconnected"
    });
});
// Test access to the users collection
app.get("/api/users/count", async (req, res) => {
    try {
        const count = await User.countDocuments();

        res.json({
            success: true,
            usersCount: count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to access users collection"
        });
    }
});
// Protected route to verify authentication
app.get("/api/auth/verify", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Authentication verified successfully.",
        userId: req.user.userId
    });
});
// Get the currently authenticated user's profile
app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error("Profile error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve user profile."
        });
    }
});
// Serve frontend files
app.use(express.static(
    path.join(__dirname, "../frontend/public")
));

// Connect to MongoDB before starting the server
async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
