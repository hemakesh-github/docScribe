import React from 'react';
import { Key, Sparkles, Stethoscope, CircleCheck, CircleAlert } from 'lucide-react';
import type { HealthInfo } from '../types';

interface NavbarProps {
  onOpenSettings: () => void;
  onLoadSample: () => void;
  /** True when either the backend env key or a browser override key is available. */
  engineReady: boolean;
  health: HealthInfo | null;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, onLoadSample, engineReady, health }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-slate-900 tracking-tight">docScribe</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">
                DocTalk
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:flex items-center gap-1 truncate">
              <span>Consultation Recorder &amp; Scribe</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
              {health ? (
                <span className="text-teal-600 font-medium truncate">
                  {health.engine.stt_model} · {health.engine.chat_model}
                </span>
              ) : (
                <span className="text-slate-400">connecting to backend…</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onLoadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-lg transition-all"
            title="Load sample doctor-patient interaction"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">Try Demo Sample</span>
            <span className="sm:hidden">Demo</span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
              engineReady
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {engineReady ? (
              <CircleCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <CircleAlert className="w-4 h-4 text-amber-600" />
            )}
            <span className="hidden sm:inline">{engineReady ? 'AI Engines Ready' : 'Add API Key'}</span>
            <Key className="w-3.5 h-3.5 sm:hidden" />
          </button>
        </div>
      </div>
    </header>
  );
};
