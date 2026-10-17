export interface Medication {
  name: string;
  dosage: string;
  timing: string;
  instructions: string;
  purpose: string;
}

export interface FormattedConsultation {
  consultation_title: string;
  patient_name: string;
  doctor_name: string;
  chief_complaints: string[];
  clinical_assessment: string;
  medications: Medication[];
  tests_ordered: string[];
  diet_and_lifestyle: string[];
  red_flags: string[];
  follow_up_instructions: string;
  patient_peace_of_mind_summary: string;
}

export interface ConsultationRecord {
  id: string;
  title: string;
  date: string;
  doctor_name: string;
  patient_name: string;
  language_code: string;
  raw_transcript: string;
  formatted: FormattedConsultation;
  audio_url?: string;
}

/** Product-level capture intent. Backend maps this to the right Sarvam engine mode. */
export type CapturePurpose = 'clean' | 'verbatim';

export interface EngineInfo {
  stt_model: string;
  chat_model: string;
  translate_model: string;
  tts_model: string;
  stt_purposes: CapturePurpose[];
  auto_language: string;
}

export interface HealthInfo {
  status: string;
  service: string;
  version: string;
  has_env_key: boolean;
  engine: EngineInfo;
}

export interface TranscribeResult {
  transcript: string;
  language_code: string | null;
  language_probability: number | null;
  purpose: CapturePurpose;
  is_demo?: boolean;
  engine?: { model: string; mode: string };
  message?: string;
}

export interface FormatResult {
  source: string;
  formatted: FormattedConsultation;
  raw_transcript: string;
}

export interface TranslateResult {
  translated_text: string;
  engine?: { model: string; chunks?: number };
  is_demo?: boolean;
  message?: string;
}

export interface TtsResult {
  audio_base64: string | null;
  mime?: string;
  engine?: { model: string; speaker?: string };
  is_demo?: boolean;
  message?: string;
}
