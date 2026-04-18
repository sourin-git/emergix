import os
import json
import base64
import tempfile
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def analyze_triage(symptoms: str, age: int = None, location_type: str = "urban"):
    system_prompt = """You are an emergency medical triage AI for India. 
Given symptoms, return urgency level (LOW/MEDIUM/HIGH/CRITICAL), suggested emergency type, nearest facility type needed, and first-aid steps. 
Respond in JSON only with the exact schema:
{
  "urgency": "string",
  "emergency_type": "string",
  "facility_needed": "string",
  "first_aid_steps": ["string"],
  "estimated_response_time": "string"
}"""

    user_prompt = f"Patient Query: {symptoms}"
    if age: user_prompt += f", Est Age: {age}"
    user_prompt += f", Location Scope: {location_type}"

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"OpenAI GPT Error: {e}")
        raise e

async def transcribe_audio(audio_b64: str, language: str) -> str:
    try:
        audio_data = base64.b64decode(audio_b64)
        
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
            tmp_file.write(audio_data)
            tmp_path = tmp_file.name

        with open(tmp_path, "rb") as audio_file:
            # Whisper executes mapping the translated language scope effectively
            transcript = await client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file,
                prompt=f"This is emergency medical audio in {language}."
            )
        
        os.unlink(tmp_path)
        return transcript.text
    except Exception as e:
        print(f"Whisper Error: {e}")
        raise e
