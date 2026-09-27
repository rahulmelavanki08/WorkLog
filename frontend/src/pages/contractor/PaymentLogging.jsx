import React, { useState, useEffect } from 'react';
import { contractorApi } from '../../services/api';
import TrustScoreBadge from '../../components/TrustScoreBadge';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Users,
  AlertTriangle,
  History,
  ShieldCheck,
  Building
} from 'lucide-react';

export default function PaymentLogging() {
  const [payments, setPayments] = useState([]);
  const [linkedWorkers, setLinkedWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [workerId, setWorkerId] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('UPI'); // 'UPI' | 'CASH'
  const [status, setStatus] = useState('FULL'); // 'FULL' | 'PARTIAL' | 'UNPAID'
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchPaymentData = async () => {
    try {
      const res = await contractorApi.getPaymentHistory();
      if (res.data.success) {
        setPayments(res.data.payments);
        setLinkedWorkers(res.data.linkedWorkers);
        if (res.data.linkedWorkers.length > 0 && !workerId) {
          setWorkerId(res.data.linkedWorkers[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const handleLogPayment = async (e) => {
    e.preventDefault();
    if (!workerId || !amount) return;

    setSubmitting(true);
    try {
      const res = await contractorApi.logPayment({
        workerId,
        amount: Number(amount),
        mode,
        status,
        date,
        dueDate: dueDate || null,
        notes: notes.trim() || null,
      });

      if (res.data.success) {
        setSuccessMessage(res.data.message);
        setAmount('');
        setNotes('');
        if (status === 'FULL') {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#0F6E56', '#10B981', '#639922'],
          });
        }
        fetchPaymentData();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      alert('Failed to log payment: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Settlement Engine
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Trust Reputation Linked</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Log Worker Payments & Settlements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full on-time wage settlements reward your contractor reputation with <strong>+5 Trust Score points</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Logging Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-worklog-teal" />
            <span>Record New Wage Payment</span>
          </h2>

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogPayment} className="space-y-4">
            {/* Worker Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Worker *
              </label>
              {linkedWorkers.length > 0 ? (
                <select
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
                >
                  {linkedWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.trades.join(', ') || 'Worker'}) — {w.siteName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  No linked workers yet. Accept applicants from job postings to link workers.
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 4800"
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-worklog-teal outline-none"
                />
              </div>
            </div>

            {/* Mode & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Mode *
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
                >
                  <option value="UPI">UPI / Bank Transfer</option>
                  <option value="CASH">Direct Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
                >
                  <option value="FULL">FULL (Settled)</option>
                  <option value="PARTIAL">PARTIAL (Advance)</option>
                  <option value="UNPAID">UNPAID (Pending)</option>
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Notes / Reference (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Weekly settlement for 5 shifts on Metro site"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
              />
            </div>

            {/* Trust Engine Notice */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 uppercase text-[10px]">Reputation Engine:</div>
              <div>• <strong>FULL on-time:</strong> +5 Contractor Trust Score</div>
              <div>• <strong>Overdue &gt;7 days:</strong> -15 Contractor Trust Score</div>
            </div>

            <button
              type="submit"
              disabled={submitting || linkedWorkers.length === 0}
              className="w-full py-3.5 px-4 bg-worklog-teal hover:bg-worklog-tealDark disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-98"
            >
              {submitting ? 'Recording Payment...' : 'LOG WAGE PAYMENT'}
            </button>
          </form>
        </div>

        {/* Payment History Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <History className="w-4 h-4 text-worklog-teal" />
              <span>Settlement History Log ({payments.length})</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Worker Name</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length > 0 ? (
                  payments.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {new Date(pmt.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {pmt.worker?.name || 'Worker'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-semibold">
                          {pmt.mode}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
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
                      <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                        {pmt.notes || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                        ₹{Number(pmt.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No payments logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
