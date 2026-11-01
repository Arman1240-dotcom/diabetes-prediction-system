
from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    average_precision_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = PROJECT_ROOT / "dataset" / "diabetes_prediction_dataset.csv"
MODEL_DIR = PROJECT_ROOT / "ml" / "models"
MODEL_PATH = MODEL_DIR / "diabetes_model.joblib"

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

TARGET = "diabetes"

CATEGORICAL_FEATURES = ["gender", "smoking_history"]
NUMERICAL_FEATURES = [
    "age",
    "hypertension",
    "heart_disease",
    "bmi",
    "HbA1c_level",
    "blood_glucose_level",
]


def main():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)

    expected_columns = FEATURES + [TARGET]
    if set(df.columns) != set(expected_columns):
        raise ValueError(
            f"Unexpected dataset columns. Found: {df.columns.tolist()}"
        )

    if df.isnull().any().any():
        raise ValueError("Dataset contains missing values.")

    X = df[FEATURES]
    y = df[TARGET].astype(int)

    if not set(y.unique()).issubset({0, 1}):
        raise ValueError("The diabetes target must contain only 0 and 1.")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    preprocessing = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            ),
            ("numerical", "passthrough", NUMERICAL_FEATURES),
        ]
    )

    model = Pipeline(
        steps=[
            ("preprocessing", preprocessing),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=200,
                    random_state=42,
                    class_weight="balanced",
                    n_jobs=-1,
                ),
            ),
        ]
    )

    print("Training Random Forest model...")
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)[:, 1]

    print("\nDATA SPLIT")
    print(f"Training records: {len(X_train)}")
    print(f"Testing records: {len(X_test)}")

    print("\nEVALUATION")
    print(f"Accuracy: {accuracy_score(y_test, predictions):.4f}")
    print(f"ROC-AUC: {roc_auc_score(y_test, probabilities):.4f}")
    print(
        f"PR-AUC (average precision): "
        f"{average_precision_score(y_test, probabilities):.4f}"
    )

    print("\nCLASSIFICATION REPORT")
    print(
        classification_report(
            y_test,
            predictions,
            labels=[0, 1],
            target_names=["No diabetes", "Diabetes"],
            zero_division=0,
        )
    )

    print("CONFUSION MATRIX (actual rows, predicted columns)")
    print(confusion_matrix(y_test, predictions, labels=[0, 1]))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    print(f"\nModel saved to: {MODEL_PATH}")


if __name__ == "__main__":
    main()
