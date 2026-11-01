
import csv
from pathlib import Path
from collections import Counter

DATASET_PATH = (
    Path(__file__).resolve().parent.parent
    / "dataset"
    / "diabetes_prediction_dataset.csv"
)

EXPECTED_COLUMNS = [
    "gender",
    "age",
    "hypertension",
    "heart_disease",
    "smoking_history",
    "bmi",
    "HbA1c_level",
    "blood_glucose_level",
    "diabetes",
]

if not DATASET_PATH.exists():
    raise FileNotFoundError(
        f"Dataset not found at: {DATASET_PATH}"
    )

row_count = 0
missing_counts = Counter()
column_types = {}
diabetes_counts = Counter()
gender_values = Counter()
smoking_values = Counter()

with DATASET_PATH.open("r", encoding="utf-8-sig", newline="") as file:
    reader = csv.DictReader(file)

    columns = reader.fieldnames

    if not columns:
        raise ValueError("The CSV file has no header row.")

    print("\nCOLUMN NAMES:")
    print(columns)

    missing_columns = set(EXPECTED_COLUMNS) - set(columns)
    extra_columns = set(columns) - set(EXPECTED_COLUMNS)

    print("\nEXPECTED COLUMN CHECK:")
    print("Missing expected columns:", sorted(missing_columns))
    print("Additional columns:", sorted(extra_columns))

    for row in reader:
        row_count += 1

        for column in columns:
            value = (row.get(column) or "").strip()

            if value == "":
                missing_counts[column] += 1

        if "diabetes" in row:
            diabetes_counts[(row.get("diabetes") or "").strip()] += 1

        if "gender" in row:
            gender_values[(row.get("gender") or "").strip()] += 1

        if "smoking_history" in row:
            smoking_values[(row.get("smoking_history") or "").strip()] += 1

print("\nDATASET SUMMARY")
print("File:", DATASET_PATH.name)
print("Total records:", row_count)
print("Total columns:", len(columns))

print("\nMISSING VALUES")
for column in columns:
    print(f"{column}: {missing_counts[column]}")

print("\nDIABETES TARGET DISTRIBUTION")
for value, count in sorted(diabetes_counts.items()):
    print(f"{value!r}: {count}")

print("\nGENDER VALUES")
print(dict(gender_values))

print("\nSMOKING HISTORY VALUES")
print(dict(smoking_values))
