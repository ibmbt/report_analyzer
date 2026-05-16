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
SUPABASE_KEY=butt bhai idhar bhi key plej
GROQ_API_KEY=butt bhai api daal dena idhar
```

Start the API server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify it is running by opening: `http://localhost:8000`  
You should see: `{"status": "Processing Layer Active"}`

### 3.4 Supabase database setup

In your Supabase project, create a table named reports with at least these columns:

| Column | Type | Notes |
| :---- | :---- | :---- |
| id | uuid (primary key) | Auto-generated |
| user\_id | text / uuid | Links report to logged-in user |
| extracted\_metrics | jsonb | Key–value pairs of test results |
| ai\_summary | text | Short plain-English summary |
| raw\_ocr\_text | text | Raw text extracted from the file |
| report\_date | timestamptz | Default: now() |

Enable Email/Password authentication under Authentication → Providers in the Supabase dashboard.

### 3.5 Frontend setup (Next.js)

Open a new terminal:

cd frontend

npm install

Create frontend/.env.local:

NEXT\_PUBLIC\_SUPABASE\_URL=https://your-project.supabase.co

NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=your\_supabase\_anon\_public\_key

NEXT\_PUBLIC\_API\_URL=http://localhost:8000

Start the web app:

npm run dev

Open the application in your browser: [http://localhost:3000](http://localhost:3000/)

### 3.6 Production build (optional)

Frontend:

cd frontend

npm run build

npm start

Backend: Run uvicorn main:app \--host 0.0.0.0 \--port 8000 on your server and set NEXT\_PUBLIC\_API\_URL to your deployed API URL.

---
## 4\. Getting Started (First-Time User)

1. Open the application URL in your browser.  
2. On the login screen, enter your email and password.  
3. Click Sign Up to create a new account, or Sign In if you already have one.  
4. After login, you are taken to the Dashboard with the sidebar: Dashboard, Timeline, and History.

---
