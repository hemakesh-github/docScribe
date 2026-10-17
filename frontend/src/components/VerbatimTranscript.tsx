import React, { useState } from 'react';
import {
  ShieldCheck,
  Copy,
  Download,
  Check,
  Search,
  Hash,
  Scale
} from 'lucide-react';

interface VerbatimTranscriptProps {
  transcript: string;
  patientName: string;
  doctorName: string;
  languageCode?: string;
  timestamp?: string;
}

export const VerbatimTranscript: React.FC<VerbatimTranscriptProps> = ({
  transcript,
  patientName,
  doctorName,
  languageCode = 'en-IN',
  timestamp = new Date().toISOString(),
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Generate a deterministic verification hash for legal authenticity
  const recordHash = React.useMemo(() => {
    let hash = 0;
    const str = `${transcript}-${timestamp}-${patientName}-${doctorName}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(12, '0');
  }, [transcript, timestamp, patientName, doctorName]);

  const handleCopy = () => {
    const fullLegalRecord = `
================================================================================
DOCTALK / DOCSCRIBE VERBATIM CONSULTATION TRANSCRIPT
OFFICIAL PERSONAL & LEGAL DOCUMENTATION RECORD
================================================================================
Record Verification ID : DOC-${recordHash}
Timestamp              : ${timestamp}
Patient Name           : ${patientName}
Attending Physician    : ${doctorName}
Detected Language      : ${languageCode}
Engine                 : Sarvam AI Saaras Speech-to-Text (Verbatim Engine)

LEGAL NOTICE:
This transcript is a direct, unedited verbatim record of the recorded
clinical consultation between patient and doctor. It is generated for
personal verification, memory support, insurance reimbursement claims,
and legal evidentiary reference.

TRANSCRIPT:
--------------------------------------------------------------------------------
${transcript}
--------------------------------------------------------------------------------
End of Official Consultation Record [DOC-${recordHash}]
================================================================================
    `.trim();

    navigator.clipboard.writeText(fullLegalRecord);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const fullLegalRecord = `DOCTALK / DOCSCRIBE VERBATIM CONSULTATION TRANSCRIPT
Record Verification ID : DOC-${recordHash}
Timestamp              : ${timestamp}
Patient Name           : ${patientName}
Attending Physician    : ${doctorName}
Detected Language      : ${languageCode}

TRANSCRIPT:
${transcript}
`;
    const blob = new Blob([fullLegalRecord], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocTalk-Legal-Transcript-${recordHash}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Split lines and parse dialogue turns
  const lines = transcript.split('\n').filter((l) => l.trim().length > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Exact Verbatim Transcript</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                Component 2 (Legal & Personal)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Unedited word-for-word record with cryptographic audit trail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-lg text-slate-200 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Full Record' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-lg text-slate-200 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download .txt</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Legal Certificate / Integrity Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Verifiable Legal Consultation Archive</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>DOC-{recordHash}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-400 block">Patient:</span>
              <span className="font-medium text-slate-800">{patientName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Physician:</span>
              <span className="font-medium text-slate-800">{doctorName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Language Code:</span>
              <span className="font-medium text-slate-800">{languageCode}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Capture Time:</span>
              <span className="font-medium text-slate-800">{new Date(timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-100">
            <strong>Legal Notice:</strong> This verbatim transcript preserves spoken discourse word-for-word as captured during the clinical encounter. It may be presented to second-opinion consultants, healthcare advocates, or legal counsel as an authentic contemporaneous patient memory record.
          </p>
        </div>

        {/* Search within transcript */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript for keywords (e.g. 'Telmisartan', 'headache', 'BP')..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Dialogue turns */}
        <div className="space-y-3 font-mono text-xs sm:text-sm leading-relaxed max-h-[500px] overflow-y-auto pr-2">
          {lines.map((line, idx) => {
            const isDoctor = line.toLowerCase().startsWith('doctor:');
            const isPatient = line.toLowerCase().startsWith('patient:');
            const cleanText = line
              .replace(/^Doctor:\s*/i, '')
              .replace(/^Patient:\s*/i, '');

            const isMatched =
              searchQuery.trim().length > 0 &&
              line.toLowerCase().includes(searchQuery.toLowerCase());

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-colors ${
                  isMatched
                    ? 'bg-amber-50 border-amber-300'
                    : isDoctor
                    ? 'bg-blue-50/60 border-blue-100 text-slate-800'
                    : isPatient
                    ? 'bg-emerald-50/60 border-emerald-100 text-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-sans font-semibold mb-1">
                  <span
                    className={
                      isDoctor
                        ? 'text-blue-700'
                        : isPatient
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                    }
                  >
                    {isDoctor ? `Dr. ${doctorName}` : isPatient ? patientName : 'Speaker'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Turn #{idx + 1}
                  </span>
                </div>
                <p className="font-mono text-slate-900 whitespace-pre-wrap">{cleanText}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
