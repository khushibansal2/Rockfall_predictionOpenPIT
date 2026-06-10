import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Literal
import model as ml

DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    ml.load_model()
    yield


app = FastAPI(
    title="Rockfall Prediction API",
    description="Predicts rockfall risk in open pit mines using ML",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictionRequest(BaseModel):
    rock_type: Literal["Igneous", "Metamorphic", "Sedimentary"] = Field(..., example="Sedimentary")
    date: str = Field(..., example="2024-07-15", description="ISO date YYYY-MM-DD")
    rainfall: float = Field(..., ge=0, le=50, example=35.0, description="Rainfall in mm")
    slope_angle: float = Field(..., ge=5, le=70, example=50.0, description="Slope angle in degrees")
    ndvi: float = Field(..., ge=0.1, le=0.7, example=0.2, description="Normalized Difference Vegetation Index")
    change_in_ndvi: float = Field(..., ge=-0.05, le=0.05, example=-0.03)
    soil_moisture: float = Field(..., ge=10, le=40, example=35.0, description="Soil moisture %")
    blast_vibration: float = Field(..., ge=0, le=0.3, example=0.25, description="Peak Particle Velocity m/s")
    seismic_vibration: float = Field(..., ge=0, le=0.05, example=0.04, description="Seismic vibration m/s")


@app.get("/health")
def health():
    return {"status": "ok", "model": "Random Forest Classifier"}


@app.post("/predict")
def predict(req: PredictionRequest):
    try:
        result = ml.predict_risk(
            rock_type=req.rock_type,
            date=req.date,
            rainfall=req.rainfall,
            slope_angle=req.slope_angle,
            ndvi=req.ndvi,
            change_in_ndvi=req.change_in_ndvi,
            soil_moisture=req.soil_moisture,
            blast_vibration=req.blast_vibration,
            seismic_vibration=req.seismic_vibration,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dataset-stats")
def dataset_stats():
    try:
        return ml.get_dataset_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Serve the React build in production (when dist/ exists)
if os.path.isdir(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
