# docScribe / DocTalk 🩺

> **Doctor Consultation Recorder & Clinical AI Scribe**  
> Transcribe consultations, extract AI action points, archive records in SQLite, and email the patient. Powered by **Sarvam AI**.

---

## 🚀 Native Deployment (No Docker)

### 1. Configure Backend Environment
All API keys, engine configurations, and SMTP settings live strictly in `backend/.env`:

```bash
cd backend
nano .env   # Or edit with any text editor
```

Set your Sarvam API Key:
```env
SARVAM_API_KEY=your_sarvam_api_key_here
```

*(Optional: Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` if you want automatic SMTP delivery. Otherwise, the app provides a 1-click `mailto:` action that pre-fills Gmail/Outlook).*

### 2. Run with One Command

From the project root:
```bash
./start.sh
```

That's it!
- The single FastAPI server serves **both** the React frontend and all API endpoints at:
  👉 **http://localhost:8000**
- Interactive API Documentation:
  👉 **http://localhost:8000/docs**

---

## ⚙️ Manual Step-by-Step (If Running Separately)

### 1. Build Frontend
```bash
cd frontend
npm install
npm run build
```
*(Produces static assets in `frontend/dist` which FastAPI automatically mounts at `/`).*

### 2. Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 📁 Project Structure

```
docScribe/
├── backend/
│   ├── .env               # All backend configs & Sarvam API key
│   ├── config.py          # Centralized configuration loader
│   ├── database.py        # SQLite schema & helpers (consultations & doctors)
│   ├── mailer.py          # Email & mailto generator
│   ├── main.py            # FastAPI endpoints + static frontend mounting
│   ├── consultations.db   # SQLite database
│   ├── uploads/           # Stored audio recordings
│   └── venv/              # Python virtual environment
├── frontend/
│   ├── dist/              # Production built bundle
│   ├── src/
│   │   ├── App.tsx        # Screen 1 (Patient/Doctor) & Screen 2 (Record/Action Points)
│   │   ├── index.css      # Tailwind styling
│   │   └── main.tsx
│   └── package.json
├── start.sh               # Native 1-command production runner
└── README.md
```

---

## 🔄 Application Workflow

1. **Screen 1 (Patient Details & Doctor Selection)**:
   - Enter Patient Name and Email.
   - Choose Doctor from dropdown (or click `+ Add Doctor` to save a new doctor to SQLite).
   - Click **"Proceed to Consultation Meeting"**.

2. **Screen 2 (Record, Transcribe & Extract Action Points)**:
   - Record live consultation audio via microphone, upload an audio file, or click **"Use Sample Audio (1-Click)"**.
   - Click **"Transcribe, Extract Action Points & Save to SQLite"**:
     - Transcribes using **Sarvam AI Saaras STT**.
     - Extracts clear **Action Points**, **Prescription Table**, **Diet/Lifestyle advice**, and **Follow-up date** using the AI model.
     - Preserves **Component 2: Exact Verbatim Transcript** for personal and legal records.
     - Saves the audio and consultation into **SQLite** (`consultations.db`).
     - Dispatches/prepares the patient email with action points & summary.

3. **Past Records**:
   - Click **"SQLite Records"** to review previous consultation records anytime.
# docScribe
