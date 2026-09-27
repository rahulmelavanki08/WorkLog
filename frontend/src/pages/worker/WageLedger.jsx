import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workerApi } from '../../services/api';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Download,
  Calendar,
  IndianRupee,
  FileText
} from 'lucide-react';

export default function WageLedger() {
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    async function loadLedger() {
      try {
        const res = await workerApi.getWageLedger();
        if (res.data.success) {
          setLedgerData(res.data);
        }
      } catch (err) {
        console.error('Failed to load ledger:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLedger();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-worklog-teal border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Wage Ledger...</span>
        </div>
      </div>
    );
  }

  const { summary, ledger, payments } = ledgerData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-wider text-worklog-teal bg-worklog-tealLight px-2.5 py-0.5 rounded-full">
              Automated Wage Calculation
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Immutable Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Worker Wage & Attendance Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Wages are automatically credited to your balance upon contractor confirmation.
          </p>
        </div>

        <Link
          to="/worker/report"
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Smart Dispute Assistant</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 border-l-4 border-l-emerald-600 space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Gross Earned
          </span>
          <div className="text-3xl font-black text-slate-900">
            ₹{(summary?.totalEarned || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-emerald-700">
            {summary?.confirmedDays || 0} Confirmed Shifts
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 border-l-4 border-l-slate-600 space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Paid by Contractors
          </span>
          <div className="text-3xl font-black text-slate-900">
            ₹{(summary?.totalPaid || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-slate-500">
            {payments?.length || 0} Logged Transactions
          </div>
        </div>

        <div className="bg-worklog-coralLight rounded-3xl p-6 shadow-sm border border-worklog-coral/40 border-l-4 border-l-worklog-coral space-y-1">
          <span className="text-xs font-bold text-worklog-coral uppercase tracking-wider">
            Verified Outstanding Balance
          </span>
          <div className="text-3xl font-black text-worklog-coral">
            ₹{(summary?.runningBalance || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-rose-700">
            Payable to Worker
          </div>
        </div>
      </div>

      {/* Daily Attendance Ledger Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-worklog-teal" />
            <span>Shift Attendance & Wage Calculation Records</span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{ledger?.length || 0} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Shift Date</th>
                <th className="px-5 py-3">Worksite / Contractor</th>
                <th className="px-5 py-3">Timestamps</th>
                <th className="px-5 py-3">Selfie Stamped</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Daily Rate</th>
                <th className="px-5 py-3 text-right">Amount Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger && ledger.length > 0 ? (
                ledger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {new Date(row.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{row.siteName}</div>
                      <div className="text-[11px] text-slate-500">{row.contractorName}</div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="text-[11px] text-slate-600">
                        In: <strong>{new Date(row.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Out: {row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Active Shift'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {row.checkInPhoto && (
                        <button
                          onClick={() => setSelectedPhoto(row.checkInPhoto)}
                          className="w-9 h-9 rounded-lg overflow-hidden border border-slate-300 hover:opacity-80 transition-opacity bg-slate-100"
                        >
                          <img src={row.checkInPhoto} alt="Selfie" className="w-full h-full object-cover" />
                        </button>
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {row.confirmationStatus === 'CONFIRMED' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>CONFIRMED</span>
                        </span>
                      ) : row.confirmationStatus === 'FLAGGED' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>FLAGGED MISMATCH</span>
                          </span>
                          {row.flagReason && (
                            <div className="text-[10px] text-rose-600 max-w-xs truncate" title={row.flagReason}>
                              {row.flagReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right font-semibold text-slate-500 whitespace-nowrap">
                      ₹{row.dailyRate}
                    </td>

                    <td className="px-5 py-3.5 text-right font-black whitespace-nowrap">
                      {row.amountEarned > 0 ? (
                        <span className="text-emerald-700 font-extrabold text-sm">
                          +₹{row.amountEarned.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0 (Pending)</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No attendance records found. Check in on site to start building your ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logged Payments Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-worklog-teal" />
            <span>Logged Contractor Payments</span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{payments?.length || 0} payments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Payment Date</th>
                <th className="px-5 py-3">Contractor</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Notes</th>
                <th className="px-5 py-3 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments && payments.length > 0 ? (
                payments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {new Date(pmt.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      {pmt.contractor?.name || 'Contractor'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono">
                        {pmt.mode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        pmt.status === 'FULL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pmt.status === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {pmt.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                      {pmt.notes || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                      ₹{Number(pmt.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
                    No payment records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Full Selfie" className="w-full h-auto rounded-xl object-cover" />
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
