import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import TrustScoreBadge from '../../components/TrustScoreBadge';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  FileText,
  Thermometer,
  CloudRain,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building
} from 'lucide-react';

export default function AdminDisputes() {
  const [attendanceDisputes, setAttendanceDisputes] = useState([]);
  const [safetyReports, setSafetyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ATTENDANCE' | 'SAFETY'
  const [activeEvidenceItem, setActiveEvidenceItem] = useState(null);

  // Resolution Modal State
  const [resolveModalItem, setResolveModalItem] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [upholdMismatch, setUpholdMismatch] = useState(false);
  const [resolving, setResolving] = useState(false);

  const fetchDisputes = async () => {
    try {
      const res = await adminApi.getDisputes();
      if (res.data.success) {
        setAttendanceDisputes(res.data.attendanceDisputes);
        setSafetyReports(res.data.safetyReports);
      }
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim() || !resolveModalItem) return;

    setResolving(true);
    try {
      const res = await adminApi.resolveDispute({
        itemType: resolveModalItem.type,
        itemId: resolveModalItem.id,
        resolutionNote: resolutionNote.trim(),
        upholdMismatchAgainstWorker: upholdMismatch,
      });

      if (res.data.success) {
        alert(res.data.message);
        setResolveModalItem(null);
        setResolutionNote('');
        fetchDisputes();
      }
    } catch (err) {
      alert('Resolution failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setResolving(false);
    }
  };

  const allItems = [
    ...attendanceDisputes,
    ...safetyReports,
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredItems = allItems.filter((item) => {
    if (filterType === 'ATTENDANCE') return item.type === 'ATTENDANCE_MISMATCH';
    if (filterType === 'SAFETY') return item.type === 'SAFETY_REPORT';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {filteredItems.length} Platform Incidents
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Dispute & Hazard Resolution</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Flagged Attendance Mismatches & Safety Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Examine full biometric & GPS evidence trails, make formal labor determinations, and adjust trust scores.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
          {[
            { id: 'ALL', label: 'All Incidents' },
            { id: 'ATTENDANCE', label: 'Attendance Mismatches' },
            { id: 'SAFETY', label: 'Safety Hazards' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Feed / Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-worklog-teal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs font-bold text-slate-500">Loading incident records...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Open Disputes</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All attendance mismatch flags and safety reports have been resolved.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isAttendance = item.type === 'ATTENDANCE_MISMATCH';
            const isResolved = item.status === 'CONFIRMED' || item.status === 'RESOLVED';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-6 shadow-sm border transition-all space-y-4 ${
                  !isResolved ? 'border-amber-300 ring-2 ring-amber-500/10' : 'border-slate-200 opacity-90'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-xl ${
                      isAttendance ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isAttendance ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                          {isAttendance ? 'Attendance Flag' : 'Weather / Environmental Hazard'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 mt-0.5">
                        {isAttendance
                          ? `Mismatch Reported on ${item.siteName}`
                          : `Hazard: ${item.riskType?.replace('_', ' ').toUpperCase()} at ${item.siteName}`}
                      </h3>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 font-semibold self-start sm:self-auto">
                    {new Date(item.date).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Parties Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Worker Party</span>
                    <div className="font-bold text-slate-900 flex items-center space-x-2">
                      <span>{item.worker?.name}</span>
                      <TrustScoreBadge score={item.worker?.trustScore || 100} compact label="Trust" />
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{item.worker?.phone}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Contractor / Site</span>
                    <div className="font-bold text-slate-900 flex items-center space-x-2">
                      <span>{item.contractor?.name || 'Assigned Contractor'}</span>
                      <TrustScoreBadge score={item.contractor?.trustScore || 100} compact label="Trust" />
                    </div>
                    <div className="text-[11px] text-slate-500">Site: {item.siteName} ({item.siteType})</div>
                  </div>
                </div>

                {/* Specific Incident Details */}
                {isAttendance ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
                      <strong className="block text-[10px] uppercase font-bold text-rose-700">Contractor Flag Reason:</strong>
                      <span>"{item.reason || 'GPS deviation or physical mismatch flagged by supervisor'}"</span>
                    </div>

                    {/* Evidence preview */}
                    <div className="flex items-center space-x-3 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                      {item.checkInPhoto && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-100">
                          <img src={item.checkInPhoto} alt="Selfie" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <div className="font-mono text-[11px] text-slate-500">GPS Stamp: {item.checkInGps}</div>
                        <div className="text-slate-800 font-semibold">
                          Check-in: {new Date(item.checkInTime).toLocaleTimeString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                      <strong className="block text-[10px] uppercase font-bold text-amber-700">Hazard Description:</strong>
                      <div>{item.details || 'Severe climatic/environmental risk reported by worker.'}</div>
                      {item.temperature && (
                        <div className="text-[11px] font-bold text-amber-800 mt-1">
                          Ambient Temp: {item.temperature}°C {item.weatherDescription && `• ${item.weatherDescription}`}
                        </div>
                      )}
                    </div>

                    {item.resolutionNote && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                        <strong className="block text-[10px] uppercase font-bold text-emerald-700">Resolution Stamped:</strong>
                        <span>"{item.resolutionNote}"</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                  {!isResolved ? (
                    <button
                      onClick={() => {
                        setResolveModalItem(item);
                        setResolutionNote('');
                        setUpholdMismatch(false);
                      }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95"
                    >
                      ADJUDICATE & RESOLVE DISPUTE
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Case Resolved & Closed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute Resolution Modal */}
      {resolveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-4">
            <button
              onClick={() => setResolveModalItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Resolve Dispute Incident</h3>
                <p className="text-xs text-slate-500">Official Labor Determination</p>
              </div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resolution Findings & Directives *
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g., GPS drift verified within acceptable accuracy. Attendance confirmed in worker's favor OR Contractor safety remediation verified..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {resolveModalItem.type === 'ATTENDANCE_MISMATCH' && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={upholdMismatch}
                      onChange={(e) => setUpholdMismatch(e.target.checked)}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Uphold Mismatch Against Worker (-5 Worker Trust Score)
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                    Leave unchecked if the evidence vindicates the worker (will mark attendance as Confirmed and credit wages).
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalItem(null)}
                  className="w-1/3 py-2.5 border border-slate-300 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving || !resolutionNote.trim()}
                  className="w-2/3 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow"
                >
                  {resolving ? 'Submitting Resolution...' : 'STAMP RESOLUTION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
