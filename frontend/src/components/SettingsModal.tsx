import React, { useEffect, useState } from 'react';
import { X, Key, ExternalLink, Check, Shield, ServerCog, Loader2 } from 'lucide-react';
import type { HealthInfo } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional browser-stored override key; normally the backend uses its own env key. */
  apiKey: string;
  onSaveKey: (key: string) => void;
  health?: HealthInfo | null;
}

const ENGINE_LABELS: { key: keyof HealthInfo['engine']; label: string }[] = [
  { key: 'stt_model', label: 'Speech-to-Text' },
  { key: 'chat_model', label: 'AI Clinical Scribe' },
  { key: 'translate_model', label: 'Translation' },
  { key: 'tts_model', label: 'Text-to-Speech' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  health,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) setInputKey(apiKey);
  }, [isOpen, apiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    onSaveKey('');
    setInputKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base">AI Engine Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Engine info — all decisions made by the backend */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <ServerCog className="w-4 h-4 text-teal-600" />
              <span>Server-configured engines (managed by the backend)</span>
            </div>
            {health ? (
              <div className="grid grid-cols-1 gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                {ENGINE_LABELS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-slate-500">{label}</span>
                    <code className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {health.engine[key]}
                    </code>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-200">
                  <span className="text-slate-500">Server API key</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${health.has_env_key ? 'text-emerald-700' : 'text-amber-700'}`}
                  >
                    {health.has_env_key ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {health.has_env_key ? 'Configured' : 'Not set (demo mode)'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading engine info from backend…
              </div>
            )}
          </div>

          {/* Optional override key */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Personal API key <span className="font-normal text-slate-400">(optional override)</span>
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder={health?.has_env_key ? 'Server key already configured' : 'Required — no server key set'}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Normally you don't need this — the server owner configures <code>SARVAM_API_KEY</code> in the backend
              environment. A key entered here is stored only in this browser and sent with your requests.
            </p>
          </div>

          <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3 text-xs text-teal-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-teal-950">
              <Shield className="w-4 h-4 text-teal-700" />
              <span>Need a free Sarvam API key?</span>
            </div>
            <p>1. Sign up at the Sarvam AI Dashboard (₹100 free credits).</p>
            <p>2. Create a key under "API Keys".</p>
            <a
              href="https://dashboard.sarvam.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-bold underline mt-1"
            >
              Open Sarvam AI Dashboard
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              onClick={handleClear}
              disabled={!apiKey}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
            >
              Clear override
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm transition-all"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save Override</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
