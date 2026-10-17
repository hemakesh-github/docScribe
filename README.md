# docScribe / DocTalk 🩺

> **Doctor Consultation Recorder & Clinical AI Scribe**
> Record or upload a doctor–patient consultation, transcribe it, extract AI action points and prescriptions, archive the record in SQLite, and email the patient a summary. Powered by [Sarvam AI](https://sarvam.ai) (Indian-language STT + LLM).

---

## ✨ Features

- **Live recording / upload / sample** — capture consultation audio via microphone, upload an audio file, or try the app instantly with 1-click sample audio.
- **Speech-to-text** — Sarvam `saaras:v4` with automatic language detection (22 Indian languages + English).
- **AI clinical scribe** — Sarvam `sarvam-105b` extracts structured, patient-friendly output:
  - Action points
  - Medication schedule (name, dosage, timing, instructions)
  - Diet / lifestyle advice
  - Follow-up guidance
  - Short summary
- **Two-tier records** — a faithful **verbatim transcript** (legal/personal record) preserved alongside the AI-formatted summary.
- **Local archive** — consultations and audio stored in SQLite + `backend/uploads/` (no cloud database).
- **Patient email** — automatic SMTP delivery if configured, otherwise a 1-click `mailto:` fallback pre-filled with the summary.
- **Doctor directory** — seeded specialists; add new doctors from the UI (stored in SQLite).
- **Demo mode** — runs fully without an API key using sample transcript + deterministic fallback results.
- **India-first, multilingual** — designed around Indian languages via Sarvam AI.

---

## 🏗️ Architecture

```
┌─────────────┐   /api/*   ┌──────────────────────────────┐   HTTPS   ┌───────────┐
│  React SPA  │ ─────────► │  FastAPI (single server, :8000) │ ───────► │ Sarvam AI │
│ (Vite + TS  │            │  • serves built frontend at /   │          │ STT+LLM   │
│  + Tailwind)│            │  • SQLite + local audio store   │          └───────────┘
└─────────────┘            │  • SMTP / mailto email          │
                           └──────────────────────────────┘
```

- **Single-process deployment** — FastAPI serves both the API and the built React bundle (`frontend/dist` mounted at `/`) on one port.
- **Server-side key** — `SARVAM_API_KEY` lives only in `backend/.env`; the browser never sees it.
- **Graceful degradation** — no API key or API failure → demo transcript / deterministic fallback, so the app is always explorable.

---

## 📋 Prerequisites

- **Python** ≥ 3.11
- **Node.js** ≥ 18
- **Sarvam AI API key** (free) — https://dashboard.sarvam.ai
- *(Optional)* SMTP credentials for automatic email (e.g. Gmail App Password)

---

## 🚀 Quick Start

```bash
# 1. Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then add your SARVAM_API_KEY

# 2. Frontend setup + build
cd ../frontend
npm install
npm run build               # → frontend/dist, auto-mounted by FastAPI

# 3. Run
cd .. && ./start.sh
```

- **App:** http://localhost:8000
- **API docs (Swagger):** http://localhost:8000/docs

`start.sh` builds `frontend/dist` if missing, activates the venv, and launches uvicorn.

---

## 🔧 Configuration

All backend config lives in `backend/.env` (see `backend/.env.example`):

| Variable | Default | Description |
|---|---|---|
| `SARVAM_API_KEY` | — | **Required for real AI.** Without it the app runs in demo mode. |
| `SARVAM_API_URL` | `https://api.sarvam.ai` | Sarvam API base URL. |
| `STT_MODEL` | `saaras:v4` | Speech-to-text model. |
| `CHAT_MODEL` | `sarvam-105b` | Chat model for action-point extraction. |
| `TRANSLATE_MODEL` | `sarvam-translate:v1` | Reserved for future translation feature. |
| `TTS_MODEL` | `bulbul:v4-flash` | Reserved for future TTS feature. |
| `SMTP_HOST` / `SMTP_PORT` | — / `587` | SMTP server (optional). |
| `SMTP_USER` / `SMTP_PASSWORD` | — | SMTP credentials (optional). |
| `SENDER_EMAIL` | `doctor@docscribe.med` | From-address for outgoing mail. |
| `HOST` / `PORT` | `0.0.0.0` / `8000` | Server bind address. |

Advanced knobs (timeouts, temperature, max tokens, language hint, key terms, max upload size) are defined in `backend/config.py`.

Without SMTP configured, the app still "emails" — it generates a `mailto:` link that opens the user's mail client with the summary pre-filled.

---

## 💻 Development Mode

Run the backend and the Vite dev server separately for hot reload:

```bash
# Terminal 1 — API
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend (port 5173, proxies /api → :8000)
cd frontend
npm run dev
```

Other frontend scripts:

```bash
npm run lint      # oxlint
npm run build     # tsc -b && vite build
npm run preview   # preview production build
```

---

## 🔄 Application Workflow

1. **Patient Details & Doctor Selection**
   - Enter patient name, email, and phone.
   - Pick a doctor from the dropdown (seeded: Cardiologist, General Physician, Diabetologist, Neurologist) or click **+ Add Doctor**.
   - Proceed to the consultation screen.

2. **Record → Transcribe → Extract → Save → Email**
   - Record live audio, upload a file, or click **Use Sample Audio (1-Click)**.
   - One click runs the full pipeline:
     1. Transcribe with Sarvam Saaras STT (auto language detect)
     2. Extract action points, medications, diet advice, and follow-up with the AI model
     3. Preserve the verbatim transcript
     4. Save record + audio to SQLite
     5. Send / prepare the patient email

3. **Past Records**
   - Open **SQLite Records** to browse past consultations, view transcripts and action points, play audio, and re-send emails.

---

## 🌐 API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Status, app name, whether a Sarvam key is configured, active models |
| `GET` | `/api/doctors` | List doctors |
| `POST` | `/api/doctors` | Add doctor (`name`, `specialty`) |
| `GET` | `/api/consultations` | List past consultations (newest first) |
| `GET` | `/api/audio/{filename}` | Stream stored audio |
| `POST` | `/api/consultation/process` | **Core pipeline** — multipart form: `patient_name`, `patient_email`, `doctor_name`, optional `file`, or `use_sample=true` |
| `POST` | `/api/consultation/send-email` | Re-send patient email for an existing record |
| `GET` | `/` | Built React SPA |

Interactive documentation: http://localhost:8000/docs

---

## 📁 Project Structure

```
docScribe/
├── backend/                 # FastAPI app
│   ├── main.py              # API endpoints + static frontend mounting
│   ├── config.py            # Centralized env-driven configuration
│   ├── database.py          # SQLite schema & helpers (consultations, doctors)
│   ├── mailer.py            # SMTP email + mailto: fallback generator
│   ├── requirements.txt
│   ├── .env.example         # Environment template (copy to .env)
│   ├── consultations.db     # SQLite database (auto-created)
│   ├── uploads/             # Stored audio recordings
│   └── venv/                # Python virtual environment
├── frontend/                # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── App.tsx          # 3 screens: details, meeting, history
│   │   ├── components/      # AudioRecorder, FormattedSummary, Navbar, ...
│   │   ├── lib/             # API client, toast
│   │   └── main.tsx
│   ├── dist/                # Production build (served by FastAPI at /)
│   └── package.json
├── start.sh                 # One-command production runner
└── README.md
```

---

## 🗄️ Data

- **SQLite** at `backend/consultations.db` (auto-initialized on first run)
  - `consultations` — patient, doctor, audio filename, verbatim transcript, action points (JSON), email status, timestamp
  - `doctors` — name + specialty (seeded with 4 doctors)
- **Audio** stored locally in `backend/uploads/` as `{uuid}_{filename}`

---

## 🧪 Testing & Linting

- **Frontend lint:** `npm run lint` (oxlint)
- **Typecheck:** included in `npm run build` (`tsc -b`)
- **Backend tests / linter:** not yet configured
- **Automated test suite:** not yet set up

---

## ⚠️ Known Limitations

- No authentication or authorization — do not expose to the public internet as-is.
- CORS is open (`*`); health data is stored unencrypted in SQLite. Suitable for local/dev/MVP use only.
- `frontend/src/lib/api.ts` and some components target a newer API surface (`/api/transcribe`, `/api/format-notes`, …) that is not yet implemented in the backend; the live UI is driven by `App.tsx`.

---

## 📄 License

No license file is present yet. All rights reserved by the author until one is added.
