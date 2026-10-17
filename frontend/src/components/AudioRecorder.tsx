import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  Volume2,
  RefreshCw,
  FileAudio,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Scale,
} from 'lucide-react';
import type { CapturePurpose } from '../types';

interface AudioRecorderProps {
  onTranscribe: (
    audioBlob: Blob | File,
    options: {
      language: string;
      purpose: CapturePurpose;
      patientName: string;
      doctorName: string;
    },
  ) => Promise<void>;
  isLoading: boolean;
  /** Engine label from backend health (display only — no decisions made here). */
  sttEngineLabel?: string;
}

const SPEECH_LANGUAGES = [
  { code: 'auto', name: 'Auto-detect language' },
  { code: 'hi-IN', name: 'Hindi (हिन्दी)' },
  { code: 'en-IN', name: 'Indian English' },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
  { code: 'te-IN', name: 'Telugu (తెలుగు)' },
  { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml-IN', name: 'Malayalam (മലയാളം)' },
  { code: 'mr-IN', name: 'Marathi (मराठी)' },
  { code: 'bn-IN', name: 'Bengali (বাংলা)' },
  { code: 'gu-IN', name: 'Gujarati (ગુજરાતી)' },
  { code: 'pa-IN', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'od-IN', name: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'ur-IN', name: 'Urdu (اردو)' },
];

const PURPOSE_OPTIONS: {
  value: CapturePurpose;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'clean',
    label: 'Readable Summary',
    description: 'Clean, normalized transcript — best for the AI clinical notes.',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    value: 'verbatim',
    label: 'Verbatim (Legal)',
    description: 'Exact word-for-word record including fillers & repetitions.',
    icon: <Scale className="w-4 h-4" />,
  },
];

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscribe,
  isLoading,
  sttEngineLabel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [language, setLanguage] = useState('auto');
  const [purpose, setPurpose] = useState<CapturePurpose>('clean');
  const [consentGiven, setConsentGiven] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => setRecordingDuration((p) => p + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startVisualizer = (stream: MediaStream) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 64;
      audioCtx.createMediaStreamSource(stream).connect(analyser);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillStyle = isPaused ? '#94a3b8' : 'rgb(13, 148, 136)';
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 2;
        }
      };
      draw();
    } catch (e) {
      console.warn('Visualizer failed to start', e);
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      setSelectedFile(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingDuration(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startVisualizer(stream);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stopVisualizer();
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      recorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error(err);
      setMicError('Could not access the microphone. Check browser permissions, or upload an audio file instead.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAudioBlob(null);
      setAudioUrl(URL.createObjectURL(file));
      setRecordingDuration(0);
      setMicError(null);
    }
  };

  const handleProcess = async () => {
    const targetAudio = selectedFile || audioBlob;
    if (!targetAudio) return;
    await onTranscribe(targetAudio, {
      language,
      purpose,
      patientName: patientName.trim() || 'Patient',
      doctorName: doctorName.trim() || 'Doctor',
    });
  };

  const hasAudio = Boolean(audioBlob || selectedFile);
  const canProcess = hasAudio && consentGiven && !isLoading;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">DocTalk Consultation Recorder</h2>
            <p className="text-xs text-teal-100">
              Record the visit, then get both components — a readable summary and a legal verbatim record.
            </p>
          </div>
          {sttEngineLabel && (
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium backdrop-blur-sm whitespace-nowrap">
              Engine: {sttEngineLabel}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="patient-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Name
            </label>
            <input
              id="patient-name"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
            />
          </div>
          <div>
            <label htmlFor="doctor-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Doctor / Clinic Name
            </label>
            <input
              id="doctor-name"
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="e.g. Dr. Arvind Raman (Cardiology)"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Capture area */}
        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70">
          <div className="flex flex-col items-center justify-center space-y-4">
            <canvas
              ref={canvasRef}
              width={280}
              height={44}
              className={`rounded-lg ${isRecording ? 'block bg-teal-50' : 'hidden'}`}
            />

            <div className="text-center">
              {isRecording ? (
                <div className={`flex items-center gap-2 font-semibold text-sm ${isPaused ? 'text-slate-600' : 'text-red-600'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-slate-400' : 'bg-red-600 animate-ping'}`} />
                  {isPaused ? 'Paused' : 'Recording'} · {formatTime(recordingDuration)}
                </div>
              ) : audioUrl ? (
                <div className="text-sm font-medium text-emerald-700 flex items-center gap-1.5">
                  <FileAudio className="w-4 h-4 text-emerald-600" />
                  {selectedFile ? `File: ${selectedFile.name}` : `Recording ready (${formatTime(recordingDuration)})`}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Press record when the consultation starts, or upload an existing recording.
                </p>
              )}
              {micError && <p className="text-xs text-red-600 mt-1.5 max-w-sm">{micError}</p>}
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
                    >
                      <Play className="w-4 h-4" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
                  >
                    <Square className="w-4 h-4 text-red-400" />
                    <span>Stop</span>
                  </button>
                </>
              )}

              <span className="text-xs text-slate-400">or</span>

              <label className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium text-sm rounded-xl cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Upload Audio</span>
                <input type="file" accept="audio/*,video/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {audioUrl && (
              <div className="w-full max-w-md pt-2">
                <audio ref={audioPlayerRef} src={audioUrl} controls className="w-full h-9 rounded-lg" />
              </div>
            )}
          </div>
        </div>

        {/* Language + capture intent (product choices only; engines decided server-side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label htmlFor="spoken-language" className="block text-xs font-semibold text-slate-700 mb-1">
              Spoken Language
            </label>
            <select
              id="spoken-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {SPEECH_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1">Transcript Style</span>
            <div className="grid grid-cols-2 gap-2">
              {PURPOSE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPurpose(opt.value)}
                  title={opt.description}
                  className={`px-3 py-2.5 text-xs font-medium rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                    purpose === opt.value
                      ? 'bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {opt.icon}
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Consent gate */}
        <label className="flex items-start gap-2.5 bg-teal-50/60 border border-teal-200 rounded-xl px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="rounded text-teal-600 focus:ring-teal-500 mt-0.5"
          />
          <span className="text-xs text-teal-950 leading-relaxed flex items-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-px" />
            <span>
              I have informed my doctor and have their permission to record this consultation. I understand the
              recording is used to generate my personal summary and legal transcript.
            </span>
          </span>
        </label>

        {/* Process button */}
        <button
          type="button"
          onClick={handleProcess}
          disabled={!canProcess}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-md ${
            canProcess
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-teal-600/20 active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Working… transcription &amp; clinical notes</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              <span>Transcribe &amp; Generate Both Components</span>
            </>
          )}
        </button>
        {!consentGiven && hasAudio && (
          <p className="text-xs text-amber-600 text-center -mt-3">Tick the consent box to continue.</p>
        )}
      </div>
    </div>
  );
};
