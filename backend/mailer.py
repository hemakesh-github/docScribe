import os
import smtplib
import urllib.parse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

from config import get_settings

settings = get_settings()

def build_email_content(patient_name: str, doctor_name: str, action_points: Dict[str, Any], raw_transcript: str) -> tuple[str, str, str]:
    subject = f"Your Medical Consultation Summary & Action Points - {doctor_name}"
    
    # Text version
    actions_list = action_points.get("action_points", [])
    actions_txt = "\n".join([f"• {act}" for act in actions_list]) if actions_list else "None specified."
    
    meds_list = action_points.get("medications", [])
    meds_txt = "\n".join([f"• {m.get('name', '')} ({m.get('dosage', '')}) - {m.get('timing', '')} | {m.get('instructions', '')}" for m in meds_list]) if meds_list else "No new medications prescribed."

    body_text = f"""Dear {patient_name},

Thank you for your visit with {doctor_name}. Here is your clear consultation summary and action plan:

--------------------------------------------------
KEY ACTION POINTS:
--------------------------------------------------
{actions_txt}

--------------------------------------------------
MEDICATION SCHEDULE:
--------------------------------------------------
{meds_txt}

--------------------------------------------------
DIETARY & LIFESTYLE ADVICE:
--------------------------------------------------
{action_points.get('diet_advice', 'Follow a balanced, low-sodium healthy diet and stay hydrated.')}

--------------------------------------------------
NEXT FOLLOW-UP:
--------------------------------------------------
{action_points.get('follow_up', 'As advised by doctor in 3-4 weeks.')}

--------------------------------------------------
VERBATIM TRANSCRIPT (FOR YOUR PERSONAL / LEGAL RECORD):
--------------------------------------------------
{raw_transcript}

Wishing you good health!
{doctor_name} / docScribe
"""

    # HTML version
    body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0d9488; color: white; padding: 16px 20px; border-radius: 8px;">
          <h2 style="margin: 0;">docScribe / DocTalk Summary</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Consultation with {doctor_name}</p>
        </div>
        
        <p>Dear <strong>{patient_name}</strong>,</p>
        <p>Here are your key action points and prescriptions from your consultation today:</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #166534;">📋 Key Action Points</h3>
          <ul>
            {''.join([f"<li>{act}</li>" for act in actions_list])}
          </ul>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; margin: 16px 0; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #0f172a;">💊 Prescribed Medications</h3>
          {''.join([f"<p style='margin: 6px 0;'><strong>{m.get('name', '')}</strong> ({m.get('dosage', '')})<br/><span style='color: #475569; font-size: 13px;'>{m.get('timing', '')} - {m.get('instructions', '')}</span></p>" for m in meds_list])}
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 4px 0; color: #1e40af;">📅 Next Follow-Up</h4>
          <p style="margin: 0; font-size: 14px;">{action_points.get('follow_up', 'Follow up in 3-4 weeks.')}</p>
        </div>

        <details style="margin-top: 24px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px;">
          <summary style="font-weight: bold; cursor: pointer; color: #475569;">📄 View Verbatim Transcript (For Personal & Legal Records)</summary>
          <pre style="white-space: pre-wrap; font-size: 12px; color: #334155; margin-top: 10px; background: #f1f5f9; padding: 10px; border-radius: 4px;">{raw_transcript}</pre>
        </details>
      </body>
    </html>
    """

    # Prepare mailto URI
    encoded_subject = urllib.parse.quote(subject)
    encoded_body = urllib.parse.quote(body_text[:1800])
    mailto_url = f"mailto:{patient_name}?subject={encoded_subject}&body={encoded_body}"

    return subject, body_text, body_html, mailto_url

def send_consultation_email(to_email: str, patient_name: str, doctor_name: str, action_points: Dict[str, Any], raw_transcript: str) -> Dict[str, Any]:
    subject, body_text, body_html, mailto_url = build_email_content(patient_name, doctor_name, action_points, raw_transcript)
    
    # If SMTP is configured
    if settings.smtp_host and settings.smtp_user and settings.smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.sender_email
            msg["To"] = to_email

            part1 = MIMEText(body_text, "plain")
            part2 = MIMEText(body_html, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.sender_email, to_email, msg.as_string())

            return {
                "success": True,
                "method": "smtp",
                "recipient": to_email,
                "message": f"Email successfully sent to {to_email}"
            }
        except Exception as e:
            return {
                "success": True,
                "method": "mailto_fallback",
                "recipient": to_email,
                "mailto_url": mailto_url,
                "message": f"SMTP attempt failed ({str(e)}). Click mailto to send instantly from your mail client."
            }

    # If no SMTP configured, return success with direct mail client URL
    return {
        "success": True,
        "method": "simulated_and_mailto",
        "recipient": to_email,
        "mailto_url": mailto_url,
        "message": f"Email ready for {to_email}! (SMTP not configured, use mailto link to send via default mail client)."
    }
