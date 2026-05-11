import io
import os
import json
import pytesseract
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Medical Report Analyzer API")

# Allow the frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Cloud Clients
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# We use a dummy UUID until we connect Next.js Authentication
DUMMY_USER_ID = "00000000-0000-0000-0000-000000000000"

@app.get("/")
def health_check():
    return {"status": "Processing Layer is active and clean."}

@app.post("/api/analyze")
async def analyze_report(report: UploadFile = File(...)):
    # --- 1. OCR Extraction ---
    try:
        image_bytes = await report.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        raw_text = pytesseract.image_to_string(image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    # --- 2. AI Summarization (Groq Llama 3) ---
    prompt = f"""
    You are a medical data extractor. Extract test names and values from this report into a JSON object.
    Also write a 2-sentence summary in simple English.
    Return ONLY valid JSON with this exact structure, nothing else:
    {{ "extracted_metrics": {{ "test_name": "value" }}, "ai_summary": "..." }}

    Report text:
    {raw_text}
    """

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"}, # Forces guaranteed JSON output
            temperature=0.2,
        )
        ai_response = json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI processing failed: {e}")

    # --- 3. Save to Supabase ---
    try:
        db_record = {
            "user_id": DUMMY_USER_ID,
            "extracted_metrics": ai_response.get("extracted_metrics", {}),
            "ai_summary": ai_response.get("ai_summary", ""),
            "raw_ocr_text": raw_text
        }
        supabase.table("reports").insert(db_record).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database save failed: {e}")

    return {"status": "success", "data": ai_response}