from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.maps_service import geocode_landmark, calculate_smart_eta

router = APIRouter()

class LandmarkRequest(BaseModel):
    landmark_text: str
    city: str

class Location(BaseModel):
    lat: float
    lng: float

class EtaRequest(BaseModel):
    origin: Location
    destination: Location
    incident_id: str

@router.post("/landmark-to-gps")
async def landmark_to_gps(data: LandmarkRequest):
    try:
        result = await geocode_landmark(data.landmark_text, data.city)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Landmark matching failed: {str(e)}")

@router.post("/eta-smart")
async def get_smart_eta(data: EtaRequest):
    try:
        result = await calculate_smart_eta(data.origin, data.destination, data.incident_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ETA intelligence gathering failed: {str(e)}")
