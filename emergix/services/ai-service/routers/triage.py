from pydantic import BaseModel
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from services.openai_service import analyze_triage, transcribe_audio

router = APIRouter()

class TriageRequest(BaseModel):
    symptoms: str
    voice_transcript: Optional[str] = None
    age: Optional[int] = None
    location_type: str = "urban"

class VoiceParseRequest(BaseModel):
    audio_base64: str
    language: str

@router.post("/triage")
async def do_triage(data: TriageRequest):
    try:
        context = data.symptoms
        if data.voice_transcript:
            context += f" (Associated Voice Context: {data.voice_transcript})"
        
        result_json = await analyze_triage(
            symptoms=context, 
            age=data.age, 
            location_type=data.location_type
        )
        return result_json
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Triage calculation failed: {str(e)}")

@router.post("/voice-parse")
async def parse_voice(data: VoiceParseRequest):
    try:
        # Dispatch base64 encoded audio mapped to the language prompt over Whisper AI
        transcript = await transcribe_audio(data.audio_base64, data.language)
        
        # Pipeline the results directly downstream to the native Triage processor
        triage_result = await analyze_triage(symptoms=transcript, location_type="unknown")
        
        return {
            "transcript": transcript,
            "triage_result": triage_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice parsing failed: {str(e)}")
