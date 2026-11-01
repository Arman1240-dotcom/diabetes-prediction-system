
import sys
import json
from pathlib import Path

import joblib
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "diabetes_model.joblib"

FEATURES = [
    "gender",
    "age",
    "hypertension",
    "heart_disease",
    "smoking_history",
    "bmi",
    "HbA1c_level",
    "blood_glucose_level",
]


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Trained model not found.")

    data = json.load(sys.stdin)

    if not isinstance(data, dict):
        raise ValueError("Input must be a JSON object.")

    if set(data.keys()) != set(FEATURES):
        raise ValueError("Input must contain exactly the eight expected features.")

    row = pd.DataFrame([data], columns=FEATURES)

    model = joblib.load(MODEL_PATH)

    prediction = int(model.predict(row)[0])
    probability = float(model.predict_proba(row)[0][1])

    print(json.dumps({
        "prediction": prediction,
        "probability": round(probability, 4)
    }))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

