# Medical Report Timeline Analyzer 

**Course:** Software Engineering (Semester Project) 

**Instructor:** Dr. Yaser Mehmood  

- Ibrahim Butt (bscs24043)
- Jaffar Kazmi (bscs24139)

# User Manual
---
## 1. Introduction
**Medical Report Timeline Analyzer** (MedAnalyzer) helps patient's caretaker understand laboratory reports without medical training. You can:
- Upload medical reports as **PDF** or **image** (JPG, PNG, etc.)
- Extract test names and values using **OCR** and **AI**
- Read a **plain-English summary** of your latest report
- **Ask questions** about the uploaded report through a constrained AI chat
- View **health trends** over time on interactive charts
- Browse a full **history** of previously analyzed reports
> **Important:** This application is an educational tool. It does **not** diagnose conditions, prescribe medication, or replace a qualified healthcare professional. Always consult your doctor for medical decisions.
---
## 2. System Requirements
### For end users (using a deployed version)
- A modern web browser (Chrome, Firefox, Edge, or Safari)
- Internet connection
- A valid email address to create an account
- A medical report file in **PDF** or **image** format
### For local installation (developers / evaluators)
| Component | Requirement |
|-----------|-------------|
| **Node.js** | v18 or newer (recommended: v20+) |
| **npm** | Comes with Node.js |
| **Python** | 3.10 or newer |
| **Tesseract OCR** | System package (required for image reports) |
| **Accounts** | [Supabase](https://supabase.com) project, [Groq](https://console.groq.com) API key |
---
## 3. Installation Guide
### 3.1 Clone the project
```bash
git clone https://github.com/ibmbt/report_analyzer.git
cd report_analyzer
```
### 3.2 Install Tesseract OCR (for image uploads)

**Ubuntu / Debian:**
```bash
sudo apt update
sudo apt install tesseract-ocr
```

**macOS (Homebrew):**
```bash
brew install tesseract
```

**Windows:**  
Download and install from the [Tesseract GitHub releases](https://github.com/UB-Mannheim/tesseract/wiki), then ensure `tesseract` is on your system PATH.

### 3.3 Backend setup (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install fastapi uvicorn python-multipart python-dotenv
pip install pytesseract pillow pypdf pydantic supabase groq
```

Create `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_or_secret_key
GROQ_API_KEY=your_groq_api_key
```

Start the API server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify it is running by opening: `http://localhost:8000`  
You should see: `{"status": "Processing Layer Active"}`
