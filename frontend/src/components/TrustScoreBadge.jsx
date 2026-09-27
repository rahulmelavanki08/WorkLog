import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, X, History } from 'lucide-react';

export default function TrustScoreBadge({ score = 100, label = 'Trust Score', compact = false, showLabel = true, history = [] }) {
  const [modalOpen, setModalOpen] = useState(false);

  const numScore = Number(score);

  // Badge Color & Category Logic
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-600/20';
  let badgeIcon = ShieldCheck;
  let statusText = 'Excellent Trust (80+)';
  let progressBg = 'bg-emerald-500';

  if (numScore < 50) {
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-600/20';
    badgeIcon = ShieldAlert;
    statusText = 'Critical Risk (<50)';
    progressBg = 'bg-rose-500';
  } else if (numScore < 80) {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-300 ring-amber-600/20';
    badgeIcon = Shield;
    statusText = 'Moderate Trust (50-79)';
    progressBg = 'bg-amber-500';
  }

  const Icon = badgeIcon;

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-transform hover:scale-105 shadow-sm ${badgeColor}`}
        title="Click to view Trust Score breakdown & platform history"
      >
        <Icon className="w-3.5 h-3.5" />
        {showLabel && !compact && <span className="text-[11px] font-semibold text-slate-600">{label}:</span>}
        <span className="font-extrabold text-sm">{numScore}</span>
        {!compact && <span className="text-[10px] text-slate-500">/ 100</span>}
      </button>

      {/* Trust Score Breakdown Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-2xl ${badgeColor}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">WorkLog Trust Score</h3>
                <div className="text-xs font-semibold text-slate-500">{statusText}</div>
              </div>
            </div>

            {/* Score Meter */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Verified Platform Reputation</span>
                <span className="text-2xl font-black text-slate-900">{numScore} <span className="text-xs font-normal text-slate-400">/ 100</span></span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-500 ${progressBg}`} style={{ width: `${Math.min(100, Math.max(5, numScore))}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1.5">
                <span className="text-rose-600">0 Critical</span>
                <span className="text-amber-600">50 Moderate</span>
                <span className="text-emerald-600">80+ Excellent</span>
              </div>
            </div>

            {/* Platform Trust Rules */}
            <div className="text-xs text-slate-600 space-y-2 mb-4">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">How Trust Score Works:</div>
              <ul className="space-y-1.5 pl-3 list-disc text-[11px]">
                <li><strong className="text-emerald-700">+3 pts</strong> per confirmed check-in/out shift pair</li>
                <li><strong className="text-emerald-700">+5 pts</strong> for contractors paying full cycle on-time</li>
                <li><strong className="text-rose-700">-10 pts</strong> for contractors leaving flagged mismatch &gt;48 hrs</li>
                <li><strong className="text-rose-700">-15 pts</strong> for overdue/partial payments past 7-day due date</li>
                <li><strong className="text-rose-700">-5 pts</strong> for workers <em>only</em> if mismatch is upheld by Admin</li>
              </ul>
            </div>

            <button
              onClick={() => setModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </>
  );
}
