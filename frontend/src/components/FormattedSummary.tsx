import React, { useState } from 'react';
import { 
  Heart, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Languages, 
  Volume2, 
  Printer, 
  Copy, 
  Check, 
  Activity, 
  Sparkles,
  Clock,
  FileCheck
} from 'lucide-react';
import type { FormattedConsultation } from '../types';

interface FormattedSummaryProps {
  data: FormattedConsultation;
  onTranslate: (targetLang: string) => Promise<void>;
  onSpeak: (text: string, lang: string) => Promise<void>;
  isTranslating: boolean;
  isSpeaking: boolean;
}

const TRANSLATION_LANGUAGES = [
  { code: 'hi-IN', name: 'Hindi (हिन्दी)' },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
  { code: 'te-IN', name: 'Telugu (తెలుగు)' },
  { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml-IN', name: 'Malayalam (മലയാളം)' },
  { code: 'mr-IN', name: 'Marathi (मराठी)' },
  { code: 'bn-IN', name: 'Bengali (বাংলা)' },
  { code: 'gu-IN', name: 'Gujarati (ગુજરાતી)' },
  { code: 'en-IN', name: 'English' },
];

export const FormattedSummary: React.FC<FormattedSummaryProps> = ({
  data,
  onTranslate,
  onSpeak,
  isTranslating,
  isSpeaking,
}) => {
  const [copied, setCopied] = useState(false);
  const [targetLang, setTargetLang] = useState('hi-IN');
  const [checklist, setChecklist] = useState({
    medsUnderstood: false,
    timingClear: false,
    dietClear: false,
    followUpNoted: false,
    redFlagsKnown: false,
  });

  const handleCopy = () => {
    const textToCopy = `
DOCSCRIBE / DOCTALK CLINICAL CONSULTATION SUMMARY
------------------------------------------------
Patient: ${data.patient_name}
Doctor: ${data.doctor_name}
Consultation: ${data.consultation_title}

PATIENT PEACE-OF-MIND SUMMARY:
${data.patient_peace_of_mind_summary}

CHIEF COMPLAINTS:
${data.chief_complaints.map((c) => `- ${c}`).join('\n')}

CLINICAL ASSESSMENT & VITALS:
${data.clinical_assessment}

MEDICATIONS PRESCRIBED:
${data.medications
  .map(
    (m) =>
      `• ${m.name} (${m.dosage}) - ${m.timing}\n  Instructions: ${m.instructions}\n  Purpose: ${m.purpose}`
  )
  .join('\n\n')}

TESTS ORDERED:
${data.tests_ordered.map((t) => `- ${t}`).join('\n')}

LIFESTYLE & DIETARY ADVICE:
${data.diet_and_lifestyle.map((d) => `- ${d}`).join('\n')}

EMERGENCY RED FLAGS:
${data.red_flags.map((r) => `! ${r}`).join('\n')}

NEXT FOLLOW-UP:
${data.follow_up_instructions}
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalChecked = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
      {/* Header bar with actions */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Formatted Clinical Summary</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Component 1
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Clear, structured & reassuring notes designed for patient peace of mind
            </p>
          </div>
        </div>

        {/* Translation and tools */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            <Languages className="w-4 h-4 text-teal-400 ml-2 mr-1" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none pr-2 cursor-pointer"
            >
              {TRANSLATION_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-800 text-white">
                  Translate to {l.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => onTranslate(targetLang)}
              disabled={isTranslating}
              className="px-2.5 py-1 text-xs font-semibold bg-teal-600 hover:bg-teal-500 rounded text-white transition-all disabled:opacity-50"
            >
              {isTranslating ? 'Translating...' : 'Translate'}
            </button>
          </div>

          <button
            onClick={() => onSpeak(data.patient_peace_of_mind_summary, targetLang)}
            disabled={isSpeaking}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-lg text-slate-200 transition-all"
            title="Read summary aloud in Indic voice (Sarvam Bulbul TTS)"
          >
            <Volume2 className="w-4 h-4 text-teal-400" />
            <span>{isSpeaking ? 'Playing...' : 'Listen'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-lg text-slate-200 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-lg text-slate-200 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Document Header (For Screen & Print) */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-teal-700">
                Patient Medical Consultation Record
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                {data.consultation_title || 'Consultation Summary'}
              </h2>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-800">Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
              <p>Platform: docScribe / DocTalk</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Patient Name:</span>
              <span className="font-semibold text-slate-800">{data.patient_name || 'Patient'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Attending Physician:</span>
              <span className="font-semibold text-slate-800">{data.doctor_name || 'Doctor'}</span>
            </div>
          </div>
        </div>

        {/* 1. Patient Peace of Mind Reassurance Box */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm mt-0.5">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-base">
                Patient Peace of Mind & Key Takeaway
              </h4>
              <p className="text-sm text-emerald-900 mt-1 leading-relaxed">
                {data.patient_peace_of_mind_summary}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Chief Complaints & Clinical Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2.5">
              <Activity className="w-4 h-4 text-teal-600" />
              Chief Complaints & Symptoms
            </h4>
            <ul className="space-y-1.5">
              {data.chief_complaints.map((c, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2.5">
              <FileCheck className="w-4 h-4 text-teal-600" />
              Doctor's Assessment & Vitals
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {data.clinical_assessment}
            </p>
          </div>
        </div>

        {/* 3. Prescription & Medication Timetable */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-teal-50/80 border-b border-teal-100 px-5 py-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-teal-950 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-700" />
              Medication & Dosage Schedule
            </h4>
            <span className="text-xs text-teal-700 font-medium bg-teal-100/80 px-2.5 py-0.5 rounded-full">
              {data.medications.length} {data.medications.length === 1 ? 'Medicine' : 'Medicines'} Prescribed
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {data.medications.map((med, idx) => (
              <div key={idx} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-base font-bold text-slate-900">{med.name}</span>
                    <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                      {med.dosage}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full w-fit">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>{med.timing}</span>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-700">Instructions: </span>
                    <span className="text-slate-800 font-medium">{med.instructions}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-700">Purpose: </span>
                    <span>{med.purpose}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Tests Ordered & Diet / Lifestyle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tests */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Diagnostic Lab Tests & Investigations
            </h4>
            <ul className="space-y-1.5">
              {data.tests_ordered.map((t, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                  <span className="font-medium text-slate-800">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Diet & Lifestyle */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Dietary & Lifestyle Advice
            </h4>
            <ul className="space-y-1.5">
              {data.diet_and_lifestyle.map((d, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 5. Warning Red Flags & Emergency Box */}
        <div className="bg-red-50/70 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">
                Emergency Red Flags (Seek Immediate Medical Care)
              </h4>
              <ul className="mt-2 space-y-1">
                {data.red_flags.map((rf, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-red-800 font-medium">
                    • {rf}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 6. Follow-up Details */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600 text-white rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold block">
                Next Follow-Up Appointment
              </span>
              <p className="text-sm font-bold text-slate-800">{data.follow_up_instructions}</p>
            </div>
          </div>
        </div>

        {/* 7. Patient Confidence & Clarity Checklist (No Print) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 no-print">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Patient Clarity Checklist
              </h4>
              <p className="text-xs text-slate-500">
                Check off these points before heading home to ensure 100% clarity.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full">
              {totalChecked} / 5 Clear
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-teal-50/50">
              <input
                type="checkbox"
                checked={checklist.medsUnderstood}
                onChange={() => toggleChecklist('medsUnderstood')}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>I understand which medicines to take and when</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-teal-50/50">
              <input
                type="checkbox"
                checked={checklist.timingClear}
                onChange={() => toggleChecklist('timingClear')}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>I know whether to take them before or after food</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-teal-50/50">
              <input
                type="checkbox"
                checked={checklist.dietClear}
                onChange={() => toggleChecklist('dietClear')}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>I understand the dietary and exercise advice</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-teal-50/50">
              <input
                type="checkbox"
                checked={checklist.redFlagsKnown}
                onChange={() => toggleChecklist('redFlagsKnown')}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>I know what danger signs require emergency help</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-teal-50/50 sm:col-span-2">
              <input
                type="checkbox"
                checked={checklist.followUpNoted}
                onChange={() => toggleChecklist('followUpNoted')}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>I have noted my follow-up visit and upcoming lab tests</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
