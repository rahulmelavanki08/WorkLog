import React, { useState, useEffect } from 'react';
import { contractorApi } from '../../services/api';
import TrustScoreBadge from '../../components/TrustScoreBadge';
import confetti from 'canvas-confetti';
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function ConfirmAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Flag Modal State
  const [flagModalRecord, setFlagModalRecord] = useState(null);
  const [flagReason, setFlagReason] = useState('');
  const [submittingFlag, setSubmittingFlag] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await contractorApi.getPendingAttendance();
      if (res.data.success) {
        setAttendanceRecords(res.data.records);
      }
    } catch (err) {
      console.error('Failed to load attendance list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleConfirm = async (record) => {
    try {
      const res = await contractorApi.confirmAttendance(record.id, record.earnedAmount || 850);
      if (res.data.success) {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#0F6E56', '#10B981'],
        });

        // Update local state
        setAttendanceRecords((prev) =>
          prev.map((r) =>
            r.id === record.id ? { ...r, confirmationStatus: 'CONFIRMED' } : r
          )
        );
      }
    } catch (err) {
      alert('Confirmation failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleOpenFlagModal = (record) => {
    setFlagModalRecord(record);
    setFlagReason('');
  };

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    if (!flagReason.trim() || !flagModalRecord) return;

    setSubmittingFlag(true);
    try {
      const res = await contractorApi.flagAttendance(flagModalRecord.id, flagReason.trim());
      if (res.data.success) {
        setAttendanceRecords((prev) =>
          prev.map((r) =>
            r.id === flagModalRecord.id
              ? { ...r, confirmationStatus: 'FLAGGED', flagReason: flagReason.trim() }
              : r
          )
        );
        setFlagModalRecord(null);
      }
    } catch (err) {
      alert('Failed to flag record: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingFlag(false);
    }
  };

  const pendingCount = attendanceRecords.filter((r) => r.confirmationStatus === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {pendingCount} Pending Verifications
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Tamper-Proof Attendance Stream</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Confirm Daily Worker Attendance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect live selfie captures, timestamps, and GPS coordinates to verify or flag shift mismatches.
          </p>
        </div>

        <a
          href="/contractor/safety-reports"
          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-2 shrink-0 transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Worker Heat & Rain Hazard Reports →</span>
        </a>
      </div>

      {/* Attendance Queue */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-worklog-teal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs font-bold text-slate-500">Loading daily attendance records...</span>
        </div>
      ) : attendanceRecords.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Attendance Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Worker check-in entries with biometric selfies and GPS coordinates will show up here for your daily approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attendanceRecords.map((record) => {
            const isConfirmed = record.confirmationStatus === 'CONFIRMED';
            const isFlagged = record.confirmationStatus === 'FLAGGED';
            const isPending = record.confirmationStatus === 'PENDING';

            return (
              <div
                key={record.id}
                className={`bg-white rounded-3xl p-5 shadow-sm border transition-all space-y-4 ${
                  isPending
                    ? 'border-amber-300 ring-2 ring-amber-500/10'
                    : isFlagged
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Top Worker & Status Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black text-slate-900">{record.worker?.name}</span>
                      <TrustScoreBadge score={record.worker?.trustScore || 100} compact label="Worker Trust" />
                    </div>
                    <div className="text-xs text-slate-500">
                      Worksite: <strong>{record.siteName}</strong>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    isConfirmed
                      ? 'bg-emerald-100 text-emerald-800'
                      : isFlagged
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}>
                    {record.confirmationStatus}
                  </span>
                </div>

                {/* Selfie Thumbnail & Details Row */}
                <div className="flex items-center space-x-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {/* Selfie Photo */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setSelectedPhoto(record.checkInPhoto)}
                      className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-200 shadow hover:opacity-90 transition-opacity block"
                      title="Click to view full photo"
                    >
                      <img
                        src={record.checkInPhoto}
                        alt="Selfie"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <span className="absolute -bottom-1 -right-1 bg-worklog-teal text-white p-0.5 rounded text-[9px] font-bold">
                      LIVE
                    </span>
                  </div>

                  {/* Verification Details */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-800 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-worklog-teal" />
                        <span>
                          In: {new Date(record.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          {record.checkOutTime && ` • Out: ${new Date(record.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`}
                        </span>
                      </div>

                    <div className="flex items-center space-x-1.5 text-slate-500 font-mono text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>GPS: {record.checkInLat.toFixed(4)}, {record.checkInLng.toFixed(4)}</span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Date: {new Date(record.date).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Wage to credit if confirmed */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-500 font-semibold">Agreed Shift Daily Rate:</span>
                  <span className="font-extrabold text-slate-900 text-sm">₹{record.earnedAmount}</span>
                </div>

                {isFlagged && record.flagReason && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-0.5">
                    <strong className="block text-[10px] uppercase font-bold text-rose-600">Flagged Reason:</strong>
                    <span>"{record.flagReason}"</span>
                  </div>
                )}

                {/* Actions */}
                {isPending ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleOpenFlagModal(record)}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Flag Mismatch</span>
                    </button>

                    <button
                      onClick={() => handleConfirm(record)}
                      className="py-2.5 px-3 rounded-xl bg-worklog-teal hover:bg-worklog-tealDark text-white font-black text-xs shadow flex items-center justify-center space-x-1.5 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CONFIRM (+3 Worker Trust)</span>
                    </button>
                  </div>
                ) : isConfirmed ? (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>VERIFIED & WAGE CREDITED</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-between border border-rose-200">
                    <span>Under Dispute Investigation</span>
                    <button
                      onClick={() => handleConfirm(record)}
                      className="text-[11px] underline font-black text-rose-900"
                    >
                      Re-confirm
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Flag Mismatch Modal */}
      {flagModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4">
            <button
              onClick={() => setFlagModalRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Flag Attendance Mismatch</h3>
                <p className="text-xs text-slate-500">Worker: {flagModalRecord.worker?.name}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitFlag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Flagging Mismatch *
                </label>
                <textarea
                  rows={3}
                  required
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="e.g. GPS coordinates outside site perimeter, selfie does not match registered worker, left site early without authorization..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-200">
                ⚠️ <strong>Fairness Policy:</strong> A contractor flag notifies the worker to review or dispute. It does not unilaterally damage the worker's Trust Score unless upheld by Admin upon evidence inspection.
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setFlagModalRecord(null)}
                  className="w-1/3 py-2.5 border border-slate-300 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFlag || !flagReason.trim()}
                  className="w-2/3 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow"
                >
                  {submittingFlag ? 'Flagging...' : 'SUBMIT MISMATCH FLAG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Full Verification Selfie" className="w-full h-auto rounded-xl object-cover" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Close Photo Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
