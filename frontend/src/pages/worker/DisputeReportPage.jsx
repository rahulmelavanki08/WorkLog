import React, { useState } from 'react';
import { workerApi } from '../../services/api';
import {
  FileText,
  Sparkles,
  Download,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ChevronRight,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

export default function DisputeReportPage() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyRate, setDailyRate] = useState(950);

  const [loading, setLoading] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await workerApi.generateDisputeReport({
        startDate,
        endDate,
        dailyRate: Number(dailyRate),
      });

      if (res.data.success) {
        setReportResult(res.data);
      }
    } catch (err) {
      alert('Failed to generate report: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!reportResult?.disputeId) return;
    const url = workerApi.getDisputePdfUrl(reportResult.disputeId);
    window.open(url, '_blank');
  };

  const copySummaryText = () => {
    if (reportResult?.summaryText) {
      navigator.clipboard.writeText(reportResult.summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-worklog-tealDark rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/80 flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Smart Dispute Assistant</span>
            </span>
            <span className="text-xs text-slate-300 font-semibold">• AI-Powered Labor Evidence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Wage Verification & Dispute Packet
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Generates a neutral, factual plain-language wage summary along with photographic and GPS evidence to present to contractors or labor authorities.
          </p>
        </div>

        {reportResult && (
          <button
            onClick={handleDownloadPdf}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center space-x-2 shrink-0 transition-transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD OFFICIAL PDF</span>
          </button>
        )}
      </div>

      {/* Date Range & Settings Form */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
          Select Date Range & Agreed Daily Rate
        </h2>

        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              From Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              To Date
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Agreed Daily Wage (₹)
            </label>
            <input
              type="number"
              required
              min="100"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-worklog-teal hover:bg-worklog-tealDark disabled:opacity-50 text-white text-xs font-black rounded-xl shadow flex items-center justify-center space-x-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Synthesizing Data...' : 'GENERATE REPORT'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Generated Report View */}
      {reportResult && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Plain-Language AI Summary Box */}
          <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-emerald-950">
                    Factual Neutral Dispute Summary
                  </h3>
                  <span className="text-[11px] text-emerald-800 font-semibold">
                    Synthesized per AI labor dispute guidelines (Under 150 words)
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={copySummaryText}
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center space-x-1 shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  className="px-3.5 py-1.5 bg-worklog-teal text-white rounded-lg text-xs font-bold hover:bg-worklog-tealDark flex items-center space-x-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Export</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-emerald-200 text-slate-800 text-sm leading-relaxed font-medium shadow-inner">
              "{reportResult.summaryText}"
            </div>

            {/* Financial Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Confirmed Shifts</span>
                <span className="text-lg font-black text-slate-900">
                  {reportResult.stats.confirmedDays} <span className="text-xs text-slate-400">/ {reportResult.stats.totalDaysLogged} days</span>
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Agreed Daily Rate</span>
                <span className="text-lg font-black text-slate-900">₹{reportResult.stats.dailyRate}</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Total Gross Earned</span>
                <span className="text-lg font-black text-emerald-800">
                  ₹{reportResult.stats.totalEarned.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
                <span className="text-[10px] font-bold uppercase text-worklog-coral block">Outstanding Due</span>
                <span className="text-lg font-black text-worklog-coral">
                  ₹{reportResult.stats.outstandingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Underlying Attendance Evidence Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-worklog-teal" />
                <span>Underlying Attendance Evidence Log ({reportResult.evidence?.attendance?.length || 0})</span>
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{reportResult.evidence?.dateRange}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Check-In</th>
                    <th className="px-5 py-3">Check-Out</th>
                    <th className="px-5 py-3">GPS Coordinates</th>
                    <th className="px-5 py-3">Photo Stamped</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportResult.evidence?.attendance?.map((att, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-900">{att.dateStr}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{att.checkInStr}</td>
                      <td className="px-5 py-3 text-slate-600">{att.checkOutStr}</td>
                      <td className="px-5 py-3 font-mono text-slate-500">{att.gpsStr}</td>
                      <td className="px-5 py-3">
                        {att.photoUrl ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                            <img src={att.photoUrl} alt="Selfie" className="w-full h-full object-cover" />
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          att.confirmationStatus === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : att.confirmationStatus === 'FLAGGED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {att.confirmationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Underling Payment Evidence Table */}
          {reportResult.evidence?.payments && reportResult.evidence.payments.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  Recorded Payments in Date Range ({reportResult.evidence.payments.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Payment Date</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Mode</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportResult.evidence.payments.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-bold text-slate-900">{p.dateStr}</td>
                        <td className="px-5 py-3 font-black text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3 font-mono">{p.mode}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            p.status === 'FULL' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
