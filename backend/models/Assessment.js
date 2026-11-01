
const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        age: {
            type: Number,
            required: true,
            min: 1,
            max: 120
        },

        gender: {
            type: String,
            required: true,
            enum: ["Male", "Female", "Other"]
        },

        bmi: {
            type: Number,
            required: true,
            min: 10,
            max: 100
        },

        hypertension: {
            type: Boolean,
            required: true
        },

        heartDisease: {
            type: Boolean,
            required: true
        },

        smokingHistory: {
            type: String,
            required: true
        },

        HbA1cLevel: {
            type: Number,
            required: true,
            min: 0,
            max: 20
        },

        bloodGlucoseLevel: {
            type: Number,
            required: true,
            min: 0,
            max: 1000
        },

        prediction: {
            type: Number,
            required: true,
            enum: [0, 1]
        },

        riskLabel: {
            type: String,
            required: true,
            enum: ["Low Risk", "High Risk"]
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Assessment", assessmentSchema);
