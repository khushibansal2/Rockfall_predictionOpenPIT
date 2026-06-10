"""
Trains a Random Forest classifier on the synthetic rockfall dataset.
Target (Rockfall_Risk) is synthesized from domain thresholds.
"""

import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "rockfall_synthetic_dataset.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "rockfall_model.joblib")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "rock_encoder.joblib")


def compute_risk(row: pd.Series) -> int:
    """Domain-based risk scoring: returns 1 (high risk) or 0 (low risk)."""
    score = 0.0

    # Slope angle: steeper = riskier (max contribution ~2.5)
    score += (row["Slope_Angle"] - 5) / (70 - 5) * 2.5

    # Rainfall: higher = riskier (~1.5)
    score += (row["Rainfall"] / 50) * 1.5

    # NDVI: low vegetation = riskier (~1.0, inverted)
    score += (1 - row["NDVI"] / 0.7) * 1.0

    # NDVI change: negative = vegetation loss = riskier (~0.5)
    score += ((-row["Change_in_NDVI"]) + 0.05) / 0.1 * 0.5

    # Soil moisture: high = riskier (~0.8)
    score += (row["Soil_Moisture"] - 10) / 30 * 0.8

    # Blast vibration: higher = riskier (~1.0)
    score += (row["Blast_Vibration"] / 0.3) * 1.0

    # Seismic vibration: higher = riskier (~1.2)
    score += (row["Seismic_Vibration"] / 0.05) * 1.2

    # Rock type risk factor
    rock_risk = {"Sedimentary": 0.5, "Metamorphic": 0.2, "Igneous": 0.0}
    score += rock_risk.get(row["Rock_Type"], 0.0)

    # Threshold at roughly top 35% of scores
    return int(score >= 5.0)


def load_and_prepare(df: pd.DataFrame):
    le = LabelEncoder()
    df = df.copy()
    df["Rock_Type_enc"] = le.fit_transform(df["Rock_Type"])

    # Extract month as seasonal signal
    df["Month"] = pd.to_datetime(df["Date"], errors="coerce").dt.month.fillna(6).astype(int)

    feature_cols = [
        "Rock_Type_enc", "Month", "Rainfall", "Slope_Angle",
        "NDVI", "Change_in_NDVI", "Soil_Moisture",
        "Blast_Vibration", "Seismic_Vibration",
    ]
    return df[feature_cols], le


def train():
    df = pd.read_csv(DATA_PATH)
    df["Rockfall_Risk"] = df.apply(compute_risk, axis=1)

    X, le = load_and_prepare(df)
    y = df["Rockfall_Risk"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    clf = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42, class_weight="balanced")
    clf.fit(X_train, y_train)

    print(classification_report(y_test, clf.predict(X_test), target_names=["Low Risk", "High Risk"]))

    joblib.dump(clf, MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    print(f"Model saved to {MODEL_PATH}")
    return clf, le


def load_model():
    if not os.path.exists(MODEL_PATH):
        train()
    clf = joblib.load(MODEL_PATH)
    le = joblib.load(ENCODER_PATH)
    return clf, le


def predict_risk(
    rock_type: str,
    date: str,
    rainfall: float,
    slope_angle: float,
    ndvi: float,
    change_in_ndvi: float,
    soil_moisture: float,
    blast_vibration: float,
    seismic_vibration: float,
):
    clf, le = load_model()

    # Encode rock type
    known_classes = list(le.classes_)
    if rock_type not in known_classes:
        rock_type = known_classes[0]
    rock_enc = int(le.transform([rock_type])[0])

    month = 6
    try:
        month = int(pd.to_datetime(date).month)
    except Exception:
        pass

    features = np.array([[
        rock_enc, month, rainfall, slope_angle,
        ndvi, change_in_ndvi, soil_moisture,
        blast_vibration, seismic_vibration,
    ]])

    prediction = int(clf.predict(features)[0])
    proba = clf.predict_proba(features)[0]
    risk_score = float(proba[1])

    clf_obj, _ = load_model()
    feature_names = [
        "Rock Type", "Month", "Rainfall", "Slope Angle",
        "NDVI", "Change in NDVI", "Soil Moisture",
        "Blast Vibration", "Seismic Vibration",
    ]
    importances = clf_obj.feature_importances_.tolist()

    return {
        "prediction": prediction,
        "risk_label": "High Risk" if prediction == 1 else "Low Risk",
        "risk_score": round(risk_score * 100, 1),
        "confidence": round(float(max(proba)) * 100, 1),
        "feature_importances": dict(zip(feature_names, [round(v, 4) for v in importances])),
    }


def get_dataset_stats():
    df = pd.read_csv(DATA_PATH)
    df["Rockfall_Risk"] = df.apply(compute_risk, axis=1)

    numeric_cols = ["Rainfall", "Slope_Angle", "NDVI", "Change_in_NDVI",
                    "Soil_Moisture", "Blast_Vibration", "Seismic_Vibration"]

    stats = {}
    for col in numeric_cols:
        stats[col] = {
            "min": round(float(df[col].min()), 3),
            "max": round(float(df[col].max()), 3),
            "mean": round(float(df[col].mean()), 3),
            "std": round(float(df[col].std()), 3),
        }

    rock_counts = df["Rock_Type"].value_counts().to_dict()
    risk_dist = df["Rockfall_Risk"].value_counts().to_dict()

    return {
        "total_records": len(df),
        "high_risk_count": int(risk_dist.get(1, 0)),
        "low_risk_count": int(risk_dist.get(0, 0)),
        "rock_type_distribution": rock_counts,
        "feature_stats": stats,
    }


if __name__ == "__main__":
    train()
