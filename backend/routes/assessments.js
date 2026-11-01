
const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const mongoose = require("mongoose");

const Assessment = require("../models/Assessment");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Path to the Python executable inside your project virtual environment.
const PYTHON_PATH = process.env.PYTHON_PATH || (
    process.platform === "win32"
        ? path.join(__dirname, "../../ml-venv/Scripts/python.exe")
        : "python3"
);

const PREDICTION_SCRIPT = path.join(
    __dirname,
    "../../ml/predict.py"
);

const ALLOWED_GENDERS = ["Male", "Female", "Other"];

const ALLOWED_SMOKING_HISTORY = [
    "never",
    "No Info",
    "current",
    "former",
    "ever",
    "not current"
];

// Run the Python ML model without using a shell.
function runPrediction(input) {
    return new Promise((resolve, reject) => {
        const python = spawn(
            PYTHON_PATH,
            [PREDICTION_SCRIPT],
            { windowsHide: true }
        );

        let stdout = "";
        let stderr = "";

        python.stdout.setEncoding("utf8");
        python.stderr.setEncoding("utf8");

        python.stdout.on("data", (chunk) => {
            stdout += chunk;
        });

        python.stderr.on("data", (chunk) => {
            stderr += chunk;
        });

        python.on("error", (error) => {
            reject(error);
        });

        python.on("close", (code) => {
            if (code !== 0) {
                return reject(
                    new Error(stderr || "Python prediction failed.")
                );
            }

            try {
                const result = JSON.parse(stdout);

                if (
                    ![0, 1].includes(result.prediction) ||
                    !Number.isFinite(result.probability) ||
                    result.probability < 0 ||
                    result.probability > 1
                ) {
                    return reject(
                        new Error("Invalid prediction output.")
                    );
                }

                resolve(result);
            } catch (error) {
                reject(error);
            }
        });

        python.stdin.on("error", (error) => {
            reject(error);
        });

        python.stdin.end(JSON.stringify(input));
    });
}

// Get the logged-in user's assessment history.
router.get("/", authMiddleware, async (req, res) => {
    try {
        const assessments = await Assessment.find({
            user: req.user.userId
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: assessments.length,
            assessments
        });
    } catch (error) {
        console.error("Assessment history error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve assessment history."
        });
    }
});

// Predict using the trained model and save the result.
router.post("/predict", authMiddleware, async (req, res) => {
    try {
        const {
            age,
            gender,
            bmi,
            hypertension,
            heartDisease,
            smokingHistory,
            HbA1cLevel,
            bloodGlucoseLevel
        } = req.body;

        // Validate required fields and types.
        if (
            !Number.isFinite(age) ||
            !Number.isFinite(bmi) ||
            !Number.isFinite(HbA1cLevel) ||
            !Number.isFinite(bloodGlucoseLevel) ||
            typeof hypertension !== "boolean" ||
            typeof heartDisease !== "boolean" ||
            !ALLOWED_GENDERS.includes(gender) ||
            !ALLOWED_SMOKING_HISTORY.includes(smokingHistory)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing assessment fields."
            });
        }

        // Validate numeric ranges.
        if (
            age < 1 || age > 120 ||
            bmi < 10 || bmi > 100 ||
            HbA1cLevel < 0 || HbA1cLevel > 20 ||
            bloodGlucoseLevel < 0 || bloodGlucoseLevel > 1000
        ) {
            return res.status(400).json({
                success: false,
                message: "One or more values are outside the allowed range."
            });
        }

        // Convert form values to the feature names and types
        // expected by the trained Python model.
        const modelInput = {
            gender,
            age,
            hypertension: Number(hypertension),
            heart_disease: Number(heartDisease),
            smoking_history: smokingHistory,
            bmi,
            HbA1c_level: HbA1cLevel,
            blood_glucose_level: bloodGlucoseLevel
        };

        const result = await runPrediction(modelInput);

        // Never accept prediction or riskLabel from the browser.
        const assessment = await Assessment.create({
            user: req.user.userId,
            age,
            gender,
            bmi,
            hypertension,
            heartDisease,
            smokingHistory,
            HbA1cLevel,
            bloodGlucoseLevel,
            prediction: result.prediction,
            riskLabel: result.prediction === 1
                ? "High Risk"
                : "Low Risk"
        });

        res.status(201).json({
            success: true,
            message: "Prediction completed and assessment saved.",
            prediction: result.prediction,
            probability: result.probability,
            riskLabel: assessment.riskLabel,
            assessment
        });
    } catch (error) {
        console.error("Prediction error:", error.message);

        res.status(500).json({
            success: false,
            message: "Prediction failed. Check the server and ML model setup."
        });
    }
});
/* Delete all assessments belonging to the logged-in user. */
router.delete("/", authMiddleware, async (req, res) => {
    try {
        const result = await Assessment.deleteMany({
            user: req.user.userId
        });

        return res.status(200).json({
            success: true,
            message: "Assessment history cleared successfully.",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Clear assessment history error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to clear assessment history."
        });
    }
});

/* Delete one assessment, but only if it belongs to the logged-in user. */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid assessment ID."
            });
        }

        const assessment = await Assessment.findOneAndDelete({
            _id: id,
            user: req.user.userId
        });

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Assessment deleted successfully."
        });
    } catch (error) {
        console.error("Delete assessment error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to delete assessment."
        });
    }
});


module.exports = router;
