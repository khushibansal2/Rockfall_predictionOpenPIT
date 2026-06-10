import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
import joblib

DATA_PATH    = os.path.join(os.path.dirname(__file__), "data", "rockfall_synthetic_dataset.csv")
MODEL_PATH   = os.path.join(os.path.dirname(__file__), "rockfall_model.joblib")
SCALER_PATH  = os.path.join(os.path.dirname(__file__), "rockfall_scaler.joblib")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "rock_encoder.joblib")

FEATURE_NAMES = [
    "Rock Type", "Month", "Rainfall", "Slope Angle",
    "NDVI", "Change in NDVI", "Soil Moisture",
    "Blast Vibration", "Seismic Vibration",
]

# Soft voting weights matching the notebook: RF=2, XGB=2, LGB=1, CAT=1
ENSEMBLE_WEIGHTS = [2, 2, 1, 1]


def compute_risk(row: pd.Series) -> int:
    score = 0.0
    score += (row["Slope_Angle"] - 5) / (70 - 5) * 2.5
    score += (row["Rainfall"] / 50) * 1.5
    score += (1 - row["NDVI"] / 0.7) * 1.0
    score += ((-row["Change_in_NDVI"]) + 0.05) / 0.1 * 0.5
    score += (row["Soil_Moisture"] - 10) / 30 * 0.8
    score += (row["Blast_Vibration"] / 0.3) * 1.0
    score += (row["Seismic_Vibration"] / 0.05) * 1.2
    score += {"Sedimentary": 0.5, "Metamorphic": 0.2, "Igneous": 0.0}.get(row["Rock_Type"], 0.0)
    return int(score >= 5.0)


def prepare_features(df: pd.DataFrame, le: LabelEncoder) -> pd.DataFrame:
    df = df.copy()
    df["Rock_Type_enc"] = le.transform(df["Rock_Type"])
    df["Month"] = pd.to_datetime(df["Date"], errors="coerce").dt.month.fillna(6).astype(int)
    return df[[
        "Rock_Type_enc", "Month", "Rainfall", "Slope_Angle",
        "NDVI", "Change_in_NDVI", "Soil_Moisture",
        "Blast_Vibration", "Seismic_Vibration",
    ]]


def train():
    df = pd.read_csv(DATA_PATH)
    df["Rockfall_Risk"] = df.apply(compute_risk, axis=1)

    le = LabelEncoder()
    le.fit(df["Rock_Type"])
    X = prepare_features(df, le)
    y = df["Rockfall_Risk"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc  = scaler.transform(X_test)

    pos_weight = float((len(y_train) - y_train.sum()) / y_train.sum())
    cat_w = [float(1 - np.mean(y_train == 0)), float(1 - np.mean(y_train == 1))]

    print("Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=200, max_depth=10, class_weight="balanced", random_state=42)
    rf.fit(X_train_sc, y_train)

    print("Training XGBoost...")
    xgb = XGBClassifier(
        n_estimators=200, max_depth=8, learning_rate=0.1,
        objective="binary:logistic", eval_metric="logloss",
        scale_pos_weight=pos_weight, random_state=42, verbosity=0,
    )
    xgb.fit(X_train_sc, y_train)

    print("Training LightGBM...")
    lgb = LGBMClassifier(
        n_estimators=200, max_depth=8, learning_rate=0.1,
        class_weight="balanced", random_state=42, verbose=-1,
    )
    lgb.fit(X_train_sc, y_train)

    print("Training CatBoost...")
    cat = CatBoostClassifier(
        iterations=200, depth=8, learning_rate=0.1,
        loss_function="Logloss", verbose=0, random_seed=42,
        class_weights=cat_w,
    )
    cat.fit(X_train_sc, y_train)

    # Soft voting ensemble — weighted average of probabilities
    models = [rf, xgb, lgb, cat]
    total_w = sum(ENSEMBLE_WEIGHTS)
    proba_train = sum(w * m.predict_proba(X_test_sc) for w, m in zip(ENSEMBLE_WEIGHTS, models)) / total_w
    y_pred = (proba_train[:, 1] >= 0.5).astype(int)

    print("\n=== Voting Ensemble (RF + XGBoost + LightGBM + CatBoost) ===")
    print(classification_report(y_test, y_pred, target_names=["Low Risk", "High Risk"]))
    print("Weighted F1:", round(f1_score(y_test, y_pred, average="weighted"), 4))

    joblib.dump(models,  MODEL_PATH)
    joblib.dump(scaler,  SCALER_PATH)
    joblib.dump(le,      ENCODER_PATH)
    print("Models saved.")
    return models, scaler, le


_cache = {}

def load_model():
    if "models" not in _cache:
        if not os.path.exists(MODEL_PATH):
            train()
        _cache["models"]  = joblib.load(MODEL_PATH)
        _cache["scaler"]  = joblib.load(SCALER_PATH)
        _cache["encoder"] = joblib.load(ENCODER_PATH)
    return _cache["models"], _cache["scaler"], _cache["encoder"]


def predict_risk(rock_type, date, rainfall, slope_angle, ndvi,
                 change_in_ndvi, soil_moisture, blast_vibration, seismic_vibration):
    models, scaler, le = load_model()

    known = list(le.classes_)
    if rock_type not in known:
        rock_type = known[0]
    rock_enc = int(le.transform([rock_type])[0])

    month = 6
    try:
        month = int(pd.to_datetime(date).month)
    except Exception:
        pass

    raw    = np.array([[rock_enc, month, rainfall, slope_angle,
                        ndvi, change_in_ndvi, soil_moisture,
                        blast_vibration, seismic_vibration]])
    scaled = scaler.transform(raw)

    total_w = sum(ENSEMBLE_WEIGHTS)
    proba   = sum(w * m.predict_proba(scaled) for w, m in zip(ENSEMBLE_WEIGHTS, models)) / total_w
    proba   = proba[0]

    prediction = int(proba[1] >= 0.5)
    risk_score = round(float(proba[1]) * 100, 1)

    rf_model    = models[0]
    importances = dict(zip(FEATURE_NAMES, [round(v, 4) for v in rf_model.feature_importances_]))

    return {
        "prediction":          prediction,
        "risk_label":          "High Risk" if prediction == 1 else "Low Risk",
        "risk_score":          risk_score,
        "confidence":          round(float(max(proba)) * 100, 1),
        "model":               "Voting Ensemble (RF + XGBoost + LightGBM + CatBoost)",
        "feature_importances": importances,
    }


def get_dataset_stats():
    df = pd.read_csv(DATA_PATH)
    df["Rockfall_Risk"] = df.apply(compute_risk, axis=1)

    numeric_cols = ["Rainfall", "Slope_Angle", "NDVI", "Change_in_NDVI",
                    "Soil_Moisture", "Blast_Vibration", "Seismic_Vibration"]
    stats = {
        col: {
            "min":  round(float(df[col].min()), 3),
            "max":  round(float(df[col].max()), 3),
            "mean": round(float(df[col].mean()), 3),
            "std":  round(float(df[col].std()), 3),
        }
        for col in numeric_cols
    }
    return {
        "total_records":          len(df),
        "high_risk_count":        int(df["Rockfall_Risk"].sum()),
        "low_risk_count":         int((df["Rockfall_Risk"] == 0).sum()),
        "rock_type_distribution": df["Rock_Type"].value_counts().to_dict(),
        "feature_stats":          stats,
    }


if __name__ == "__main__":
    train()
