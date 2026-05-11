import io
import os
import json
import pytesseract
from PIL import Image
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Medical Report Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


@app.get("/")
def health_check():
    return {"status": "Processing Layer is active and clean."}

@app.post("/api/analyze")
async def analyze_report(
    report: UploadFile = File(...),
    user_id: str = Form(...), 
):
    try:
        image_bytes = await report.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        raw_text = pytesseract.image_to_string(image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    prompt = f"""
    You are a medical data extractor. Extract test names and values from this report into a JSON object.
    Also write a breif 2 to 3 line summary in simple English.
    Return ONLY valid JSON with this exact structure, nothing else:
    {{ "extracted_metrics": {{ "test_name": "value" }}, "ai_summary": "..." }}

    Report text:
    {raw_text}
    """

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"}, 
            temperature=0.2,
        )
        ai_response = json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI processing failed: {e}")

    try:
        db_record = {
            "user_id": user_id,
            "extracted_metrics": ai_response.get("extracted_metrics", {}),
            "ai_summary": ai_response.get("ai_summary", ""),
            "raw_ocr_text": raw_text
        }
        supabase.table("reports").insert(db_record).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database save failed: {e}")

    return {"status": "success", "data": ai_response}

@app.get("/api/history")
def get_history(user_id: str):
    """Fetches all past reports for a specific user."""
    try:
        response = supabase.table("reports").select("*").eq("user_id", user_id).order("report_date", desc=True).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")