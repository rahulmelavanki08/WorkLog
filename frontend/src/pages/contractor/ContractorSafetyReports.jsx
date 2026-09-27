import React, { useState, useEffect } from 'react';
import { contractorApi } from '../../services/api';
import TrustScoreBadge from '../../components/TrustScoreBadge';
import {
  ShieldAlert,
  Thermometer,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  HardHat,
  X,
  PlusCircle,
  Sparkles,
  Phone
} from 'lucide-react';

export default function ContractorSafetyReports() {
  const [safetyReports, setSafetyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Remediation Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await contractorApi.getSafetyReports();
      if (res.data.success) {
        setSafetyReports(res.data.reports);
      }
    } catch (err) {
      console.error('Failed to load safety reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim() || !selectedReport) return;

    setSubmitting(true);
    try {
      const res = await contractorApi.resolveSafetyReport({
        reportId: selectedReport.id,
        resolutionNote: resolutionNote.trim(),
      });

      if (res.data.success) {
        alert(res.data.message);
        setSelectedReport(null);
        setResolutionNote('');
        fetchReports();
      }
    } catch (err) {
      alert('Failed to submit remediation: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = safetyReports.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-worklog-coral/80 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/80">
              WEATHER & SAFETY MONITOR
            </span>
            <span className="text-xs text-slate-300 font-semibold">• Contractor Worksite Safety</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Worker Safety & Weather Hazard Reports
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Real-time feed of climate hazards (extreme heat &gt;40°C, torrential rain) and safety disputes submitted by workers on your worksites.
          </p>
        </div>

        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
          <div className="text-[11px] font-bold uppercase text-slate-300">Pending Actions</div>
          <div className="text-2xl font-black text-amber-300">{pendingCount} Active Alert{pendingCount === 1 ? '' : 's'}</div>
        </div>
      </div>

      {/* Safety Reports Feed */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-worklog-teal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs font-bold text-slate-500">Loading worksite hazard reports...</span>
        </div>
      ) : safetyReports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">All Worksites Safe & Clear</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No weather hazards or safety reports have been logged by workers across your sites.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safetyReports.map((report) => {
            const isHeat = report.riskType === 'extreme_heat';
            const isRain = report.riskType === 'heavy_rain';
            const isPending = report.status === 'PENDING';

            return (
              <div
                key={report.id}
                className={`bg-white rounded-3xl p-6 shadow-sm border space-y-4 transition-all ${
                  isPending
                    ? 'border-worklog-coral/50 ring-2 ring-worklog-coral/10'
                    : 'border-slate-200 opacity-90'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl ${
                      isHeat
                        ? 'bg-amber-100 text-amber-800'
                        : isRain
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isHeat ? (
                        <Thermometer className="w-6 h-6" />
                      ) : isRain ? (
                        <CloudRain className="w-6 h-6" />
                      ) : (
                        <ShieldAlert className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isPending ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {report.status}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-1 capitalize">
                        {report.riskType?.replace('_', ' ')} Hazard
                      </h3>
                      <div className="text-xs text-slate-500">
                        Site: <strong>{report.siteName}</strong> ({report.siteType})
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-semibold">
                    {new Date(report.date).toLocaleDateString('en-IN')}
                  </div>
                </div>

                {/* Worker Details Box */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Reported by Worker</span>
                    <div className="font-bold text-slate-900">{report.worker?.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{report.worker?.phone}</div>
                  </div>
                  <TrustScoreBadge score={report.worker?.trustScore || 100} compact label="Trust" />
                </div>

                {/* Details & Environmental Condition */}
                <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-1">
                  <strong className="block text-[10px] uppercase font-bold text-rose-700">Observation:</strong>
                  <p className="leading-relaxed">"{report.details}"</p>
                  
                  {report.temperature && (
                    <div className="text-[11px] font-extrabold text-rose-800 pt-1 flex items-center space-x-1.5">
                      <Thermometer className="w-3.5 h-3.5" />
                      <span>Live Ambient Weather: {report.temperature}°C {report.weatherDescription && `• ${report.weatherDescription}`}</span>
                    </div>
                  )}
                </div>

                {/* Resolution Note if resolved */}
                {report.resolutionNote && (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950">
                    <strong className="block text-[10px] uppercase font-bold text-emerald-700">Contractor Remediation Taken:</strong>
                    <span>"{report.resolutionNote}"</span>
                  </div>
                )}

                {/* Action CTA */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  {isPending ? (
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setResolutionNote('');
                      }}
                      className="px-4 py-2 bg-worklog-teal hover:bg-worklog-tealDark text-white text-xs font-bold rounded-xl shadow transition-all"
                    >
                      Log Remediation / Resolve
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Remediation Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Remediation Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-4">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Worksite Safety Remediation</h3>
                <p className="text-xs text-slate-500">Site: {selectedReport.siteName}</p>
              </div>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Corrective Action / Remediation Measures Taken *
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g., Installed shade nets & high-capacity water coolers, paused outdoor scaffolding during peak heat (12-3 PM), distributed rain gear and covered open trenches..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-worklog-teal outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="w-1/3 py-2.5 border border-slate-300 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !resolutionNote.trim()}
                  className="w-2/3 py-2.5 bg-worklog-teal hover:bg-worklog-tealDark disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow"
                >
                  {submitting ? 'Saving...' : 'LOG REMEDIATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
