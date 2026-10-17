import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, 
  User, 
  Mail, 
  Mic, 
  Square, 
  Upload, 
  CheckCircle2, 
  Database, 
  ArrowRight, 
  Sparkles, 
  Pill, 
  Calendar,
  ExternalLink,
  RefreshCw,
  Plus,
  ChevronRight
} from 'lucide-react';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

interface ActionPointsData {
  action_points: string[];
  medications: Array<{
    name: string;
    dosage: string;
    timing: string;
    instructions: string;
  }>;
  diet_advice: string;
  follow_up: string;
  summary: string;
}

interface Consultation {
  id: number;
  patient_name: string;
  patient_email: string;
  doctor_name: string;
  audio_filename: string;
  raw_transcript: string;
  action_points: ActionPointsData;
  email_sent_to: string;
  created_at: string;
}

export const App: React.FC = () => {
  // Navigation: screen 1 (details) vs screen 2 (meeting/transcribe) vs history
  const [currentScreen, setCurrentScreen] = useState<'details' | 'meeting' | 'history'>('details');

  // Screen 1: Patient and Doctor details
  const [patientName, setPatientName] = useState('Ramesh Kumar');
  const [patientEmail, setPatientEmail] = useState('ramesh.kumar@example.com');
  const [patientPhone, setPatientPhone] = useState('+91 98765 43210');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('Dr. Arvind Raman (Cardiologist)');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('');
  const [showAddDoctor, setShowAddDoctor] = useState(false);

  // Screen 2: Recording and processing
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useSample, setUseSample] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Result state
  const [consultationResult, setConsultationResult] = useState<Consultation | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ message: string; mailto_url?: string } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Past consultations from SQLite
  const [historyList, setHistoryList] = useState<Consultation[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    fetchDoctors();
    fetchHistory();
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      setDoctors(data);
      if (data.length > 0 && !selectedDoctor) {
        setSelectedDoctor(`${data[0].name} (${data[0].specialty})`);
      }
    } catch (e) {
      console.error('Failed to fetch doctors', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/consultations');
      const data = await res.json();
      setHistoryList(data);
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName.trim()) return;
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDoctorName, specialty: newDoctorSpecialty || 'General' })
      });
      const newDoc = await res.json();
      setDoctors((prev) => [...prev, newDoc]);
      setSelectedDoctor(`${newDoc.name} (${newDoc.specialty})`);
      setNewDoctorName('');
      setNewDoctorSpecialty('');
      setShowAddDoctor(false);
    } catch (e) {
      console.error(e);
    }
  };

  const startRecording = async () => {
    try {
      setSelectedFile(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingDuration(0);
      setUseSample(false);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      alert('Could not access microphone. You can upload an audio file or click "Use Sample Audio".');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAudioBlob(null);
      setAudioUrl(URL.createObjectURL(file));
      setUseSample(false);
    }
  };

  const handleProcessConsultation = async () => {
    if (!patientName.trim()) {
      alert('Please enter patient name.');
      setCurrentScreen('details');
      return;
    }

    setIsLoading(true);
    setEmailStatus(null);

    try {
      const formData = new FormData();
      formData.append('patient_name', patientName);
      formData.append('patient_email', patientEmail);
      formData.append('doctor_name', selectedDoctor);

      if (useSample || (!audioBlob && !selectedFile)) {
        formData.append('use_sample', 'true');
      } else if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (audioBlob) {
        formData.append('file', audioBlob, 'consultation.wav');
      }

      const res = await fetch('/api/consultation/process', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Failed to process consultation');
      const data = await res.json();

      setConsultationResult(data);
      if (data.email_result) {
        setEmailStatus(data.email_result);
      }
      fetchHistory();
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message || 'Processing failed'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!consultationResult || !patientEmail) return;
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/consultation/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: patientEmail,
          patient_name: consultationResult.patient_name,
          doctor_name: consultationResult.doctor_name,
          action_points: consultationResult.action_points,
          raw_transcript: consultationResult.raw_transcript
        })
      });
      const data = await res.json();
      setEmailStatus(data);
    } catch (e) {
      alert('Email failed to send.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900">docScribe</span>
                <span className="text-[11px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                  DocTalk
                </span>
              </div>
              <p className="text-xs text-slate-500">Record • Transcribe • Action Points • Email</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                currentScreen === 'history'
                  ? 'bg-teal-50 border-teal-400 text-teal-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4 text-teal-600" />
              <span>SQLite Records ({historyList.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Flow */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        {/* Step Progression Bar */}
        {currentScreen !== 'history' && (
          <div className="flex items-center justify-center mb-8 gap-3 text-xs font-semibold">
            <button
              onClick={() => setCurrentScreen('details')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                currentScreen === 'details'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">1</span>
              <span>Patient & Doctor Details</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-400" />

            <button
              onClick={() => setCurrentScreen('meeting')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                currentScreen === 'meeting'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">2</span>
              <span>Record & Action Points</span>
            </button>
          </div>
        )}

        {/* ================= SCREEN 1: Patient Details & Doctor ================= */}
        {currentScreen === 'details' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                <span>Step 1: Patient Information & Attending Doctor</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter patient contact details so the AI-generated action points and summary can be automatically delivered to their email.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Patient Email (For AI Action Points Dispatch) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[11px] text-teal-700 mt-1">
                  ✉️ The AI model will pass the action points & prescriptions directly to this email after transcription.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Patient Phone / WhatsApp (Optional)
                </label>
                <input
                  type="text"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Doctor selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Attending Doctor *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddDoctor(!showAddDoctor)}
                    className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Doctor</span>
                  </button>
                </div>

                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={`${d.name} (${d.specialty})`}>
                      {d.name} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add doctor inline form */}
              {showAddDoctor && (
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-teal-900">Add Doctor to SQLite Registry</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Doctor Name (e.g. Dr. Sunita)"
                      value={newDoctorName}
                      onChange={(e) => setNewDoctorName(e.target.value)}
                      className="px-3 py-2 text-xs border border-teal-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Specialty (e.g. ENT Specialist)"
                      value={newDoctorSpecialty}
                      onChange={(e) => setNewDoctorSpecialty(e.target.value)}
                      className="px-3 py-2 text-xs border border-teal-300 rounded-lg bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDoctor}
                    className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700"
                  >
                    Save Doctor
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentScreen('meeting')}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95"
              >
                <span>Proceed to Consultation Meeting</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 2: Record / Transcribe / Action Points ================= */}
        {currentScreen === 'meeting' && (
          <div className="space-y-6">
            {/* Top Patient-Doctor Summary Card */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-teal-400 font-bold block">
                  Active Consultation
                </span>
                <h3 className="text-lg font-bold">
                  {patientName} <span className="text-slate-400 text-sm font-normal">({patientEmail})</span>
                </h3>
                <p className="text-xs text-slate-300">Consulting with {selectedDoctor}</p>
              </div>

              <button
                onClick={() => setCurrentScreen('details')}
                className="text-xs text-slate-300 hover:text-white underline w-fit"
              >
                ← Edit Patient / Doctor
              </button>
            </div>

            {/* Audio Recording / Upload Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Mic className="w-4 h-4 text-teal-600" />
                <span>Record Doctor-Patient Meeting</span>
              </h3>

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-4 text-center">
                {isRecording ? (
                  <div className="flex items-center gap-2 text-red-600 font-bold text-sm animate-pulse">
                    <span className="w-3 h-3 rounded-full bg-red-600"></span>
                    <span>Recording in progress: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                  </div>
                ) : audioUrl ? (
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Audio ready for AI processing</span>
                  </div>
                ) : useSample ? (
                  <div className="text-xs text-teal-700 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Demo consultation audio loaded (Cardiology & Diabetes)</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Press Record to capture meeting audio, or upload a sound file.
                  </p>
                )}

                {/* Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start Recording</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 animate-pulse"
                    >
                      <Square className="w-4 h-4 text-red-400" />
                      <span>Stop Recording</span>
                    </button>
                  )}

                  <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Upload Audio</span>
                    <input type="file" accept="audio/*,video/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setUseSample(true);
                      setAudioBlob(null);
                      setSelectedFile(null);
                      setAudioUrl(null);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      useSample
                        ? 'bg-teal-100 border-teal-400 text-teal-900'
                        : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Use Sample Audio (1-Click)</span>
                  </button>
                </div>

                {audioUrl && (
                  <audio src={audioUrl} controls className="w-full max-w-sm h-8 mt-2" />
                )}
              </div>

              {/* Main Submit Button */}
              <button
                type="button"
                onClick={handleProcessConsultation}
                disabled={isLoading}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  isLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transcribing with Sarvam AI & Extracting Action Points...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Transcribe, Extract Action Points & Save to SQLite</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Display */}
            {consultationResult && (
              <div className="space-y-6">
                {/* Email Delivery Banner */}
                {patientEmail && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-emerald-950">
                          Email Action Points to Patient
                        </h4>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          {emailStatus?.message || `Summary dispatched to ${patientEmail}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {emailStatus?.mailto_url && (
                        <a
                          href={emailStatus.mailto_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-all"
                        >
                          <span>Open in Mail App</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={handleResendEmail}
                        disabled={isSendingEmail}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        {isSendingEmail ? 'Sending...' : 'Resend Email'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Component 1: Action Points & Prescriptions */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                        Component 1
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">
                        Formatted Action Points & Instructions
                      </h3>
                    </div>
                    <span className="text-xs bg-teal-50 text-teal-800 font-semibold px-2.5 py-1 rounded-full border border-teal-200">
                      Saved in SQLite (Record #{consultationResult.id})
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-xl text-xs text-teal-950 leading-relaxed">
                    <strong>Doctor's Takeaway: </strong> {consultationResult.action_points.summary}
                  </div>

                  {/* Key Action Points */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Key Action Points for Patient</span>
                    </h4>
                    <ul className="space-y-2">
                      {consultationResult.action_points.action_points.map((act, idx) => (
                        <li key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 flex items-start gap-2.5 font-medium">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] shrink-0 font-bold">
                            {idx + 1}
                          </span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Prescribed Medications */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-teal-600" />
                      <span>Prescribed Medication Schedule</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {consultationResult.action_points.medications.map((m, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900">{m.name}</span>
                            <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded">
                              {m.dosage}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            <strong>Timing: </strong>{m.timing}
                          </p>
                          <p className="text-xs text-slate-500">
                            <strong>Instructions: </strong>{m.instructions}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Advice & Follow Up */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <strong className="text-slate-800 block">Diet & Lifestyle:</strong>
                      <p className="text-slate-600">{consultationResult.action_points.diet_advice}</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <strong className="text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>Next Follow-Up:</span>
                      </strong>
                      <p className="text-slate-600">{consultationResult.action_points.follow_up}</p>
                    </div>
                  </div>
                </div>

                {/* Component 2: Exact Verbatim Transcript */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                        Component 2
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">
                        Exact Verbatim Transcript (For Personal & Legal Purposes)
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Audited & Stored in SQLite
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    This unedited word-for-word record is archived in SQLite to give patients complete satisfaction, memory support, and legal reference.
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                    {consultationResult.raw_transcript}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= SCREEN 3: Past SQLite Records ================= */}
        {currentScreen === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-teal-600" />
                  <span>SQLite Consultation Archive</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Audio recordings, raw transcripts, action points, and email status saved in database.
                </p>
              </div>

              <button
                onClick={() => setCurrentScreen('details')}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700"
              >
                + New Consultation
              </button>
            </div>

            {historyList.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-500 text-xs">
                No past consultations yet. Record your first consultation to see it stored in SQLite.
              </div>
            ) : (
              <div className="space-y-4">
                {historyList.map((rec) => (
                  <div key={rec.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{rec.patient_name}</span>
                        <span className="text-xs text-slate-500 ml-2">with {rec.doctor_name}</span>
                      </div>
                      <div className="text-right text-[11px] text-slate-400">
                        {rec.created_at}
                      </div>
                    </div>

                    <div className="text-xs text-slate-700">
                      <strong className="text-slate-900 block mb-1">Action Points:</strong>
                      <ul className="list-disc list-inside space-y-0.5">
                        {(rec.action_points.action_points || []).slice(0, 3).map((act, idx) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>Audio File: {rec.audio_filename}</span>
                      <span className="text-emerald-700 font-semibold">
                        {rec.email_sent_to ? `Emailed to ${rec.email_sent_to}` : 'No email'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
