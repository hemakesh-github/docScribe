import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "consultations.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Table for consultations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT NOT NULL,
        patient_email TEXT,
        doctor_name TEXT NOT NULL,
        audio_filename TEXT,
        raw_transcript TEXT,
        action_points TEXT,
        email_sent_to TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Table for doctors
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        specialty TEXT
    )
    """)

    # Seed default doctors if empty
    cursor.execute("SELECT COUNT(*) FROM doctors")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            "INSERT INTO doctors (name, specialty) VALUES (?, ?)",
            [
                ("Dr. Arvind Raman", "Cardiologist"),
                ("Dr. Priya Sharma", "General Physician"),
                ("Dr. Rajesh Mehta", "Diabetologist / Endocrinologist"),
                ("Dr. Sunita Patel", "Neurologist")
            ]
        )

    conn.commit()
    conn.close()

def save_consultation(
    patient_name: str,
    patient_email: str,
    doctor_name: str,
    audio_filename: str,
    raw_transcript: str,
    action_points: Dict[str, Any]
) -> int:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO consultations 
        (patient_name, patient_email, doctor_name, audio_filename, raw_transcript, action_points)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        patient_name,
        patient_email,
        doctor_name,
        audio_filename,
        raw_transcript,
        json.dumps(action_points)
    ))
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()
    return record_id

def update_email_sent(record_id: int, recipient_email: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE consultations SET email_sent_to = ? WHERE id = ?", (recipient_email, record_id))
    conn.commit()
    conn.close()

def get_all_consultations() -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM consultations ORDER BY created_at DESC")
    rows = cursor.fetchall()
    results = []
    for r in rows:
        action_points = {}
        if r["action_points"]:
            try:
                action_points = json.loads(r["action_points"])
            except Exception:
                action_points = {"text": r["action_points"]}
        results.append({
            "id": r["id"],
            "patient_name": r["patient_name"],
            "patient_email": r["patient_email"],
            "doctor_name": r["doctor_name"],
            "audio_filename": r["audio_filename"],
            "raw_transcript": r["raw_transcript"],
            "action_points": action_points,
            "email_sent_to": r["email_sent_to"],
            "created_at": r["created_at"]
        })
    conn.close()
    return results

def get_all_doctors() -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors ORDER BY name ASC")
    rows = cursor.fetchall()
    doctors = [{"id": r["id"], "name": r["name"], "specialty": r["specialty"]} for r in rows]
    conn.close()
    return doctors

def add_doctor(name: str, specialty: str) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO doctors (name, specialty) VALUES (?, ?)", (name, specialty))
    conn.commit()
    doc_id = cursor.lastrowid
    conn.close()
    return {"id": doc_id, "name": name, "specialty": specialty}

# Initialize tables immediately
init_db()
