import React, { useState } from 'react';
import { QrCode, X, CheckCircle, ArrowRight, Building } from 'lucide-react';
import { workerApi } from '../services/api';

export default function DirectJoinSiteModal({ isOpen, onClose, onSuccess }) {
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await workerApi.joinSiteDirect(inviteCode.trim());
      if (res.data.success) {
        setSuccess(res.data.message);
        setTimeout(() => {
          setSuccess(null);
          setInviteCode('');
          onClose();
          if (onSuccess) onSuccess(res.data.link);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join site. Check code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Join Site via Invite Code</h3>
            <p className="text-xs text-slate-500">Direct linking without job application</p>
          </div>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center space-x-3 my-4">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-xs font-bold">{success}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contractor Site Code (or scanned QR)
              </label>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g., WL-METRO4"
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-center font-bold text-base uppercase tracking-widest focus:ring-2 focus:ring-worklog-teal focus:border-transparent outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block text-center">
                Demo code: <strong className="text-slate-600">WL-METRO4</strong> or <strong className="text-slate-600">WL-TECHC</strong>
              </span>
            </div>

            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {error}
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 border border-slate-200">
              ℹ️ Direct linking creates a pending link that activates automatically once the contractor confirms your first live check-in on that site.
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !inviteCode.trim()}
                className="w-2/3 py-2.5 rounded-xl bg-worklog-teal hover:bg-worklog-tealDark text-white text-xs font-bold shadow transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <span>{submitting ? 'Linking...' : 'LINK TO SITE'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
