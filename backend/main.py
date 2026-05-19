import io
import os
import json
import pytesseract
from PIL import Image
from pypdf import PdfReader
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List

load_dotenv()

app = FastAPI(title="Medical Report Analyzer API")

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    context: str
    language: str = "English" 

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
    return {"status": "Processing Layer Active"}

@app.post("/api/analyze")
async def analyze_report(
    report: UploadFile = File(...),
    user_id: str = Form(...) 
):
    try:
        file_bytes = await report.read()
        filename = report.filename.lower()
        
        if filename.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(file_bytes))
            raw_text = "\n".join([page.extract_text() or "" for page in reader.pages])
        else:
            image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            raw_text = pytesseract.image_to_string(image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

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
        raise HTTPException(status_code=502, detail=f"AI failed: {e}")

    try:
        db_record = {
            "user_id": user_id,
            "extracted_metrics": ai_response.get("extracted_metrics", {}),
            "ai_summary": ai_response.get("ai_summary", ""),
            "raw_ocr_text": raw_text
        }
        supabase.table("reports").insert(db_record).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB save failed: {e}")

    ai_response["raw_text"] = raw_text 
    return {"status": "success", "data": ai_response}

@app.post("/api/chat")
async def chat_with_report(req: ChatRequest):
    safe_context = req.context[:6000] 

    system_prompt = f"""
    You are a highly knowledgeable medical AI assistant. The user has uploaded a medical lab report. The raw text of their report is below.
    
    Your job is to explain what these metrics mean in plain, easy-to-understand {req.language}. 
    If the language is Urdu, YOU MUST USE ACTUAL URDU SCRIPT (Nastaliq), do NOT use Roman Urdu.
    
    CRITICAL INSTRUCTIONS FOR BREVITY:
    1. ZERO FLUFF: Start your answer immediately.
    2. STRICT LENGTH: Keep your explanation to a maximum of 3 to 4 short sentences.
    3. THE FORMAT: State what the test measures, why it might be high/low, and what their specific result implies.
    4. DISCLAIMER: Always end with a short disclaimer in {req.language} stating you are an AI, not a doctor.
    
    Report Text: {safe_context}
    """
    
    groq_messages = [{"role": "system", "content": system_prompt}]
    
    for msg in req.messages:
        groq_messages.append({"role": msg.role, "content": msg.content})
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=groq_messages,
            model="llama-3.3-70b-versatile", 
            temperature=0.7,
            timeout=10.0 
        )
        return {"answer": chat_completion.choices[0].message.content}
    except Exception as e:
        print(f"Chat Error: {e}") 
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")
    

@app.get("/api/history")
def get_history(user_id: str):
    try:
        response = supabase.table("reports").select("*").eq("user_id", user_id).order("report_date", desc=True).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History fetch failed: {e}")