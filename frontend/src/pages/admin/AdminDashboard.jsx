import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import TrustScoreBadge from '../../components/TrustScoreBadge';
import {
  ShieldAlert,
  Users,
  Building,
  HardHat,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Activity,
  Layers,
  Phone
} from 'lucide-react';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await adminApi.getDashboard();
        if (res.data.success) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-worklog-teal border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Platform Oversight...</span>
        </div>
      </div>
    );
  }

  const { totals, contractorDisputeStats } = dashboardData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/80">
              CENTRAL LABOR OVERSIGHT
            </span>
            <span className="text-xs text-slate-300 font-semibold">• Platform Integrity Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            WorkLog Platform Administration
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Monitor wage disputes, inspect geotagged biometric evidence, resolve safety hazards, and manage contractor compliance.
          </p>
        </div>

        <Link
          to="/admin/disputes"
          className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center space-x-2 shrink-0"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>INSPECT DISPUTE QUEUE ({totals?.openDisputes + totals?.openSafetyReports})</span>
        </Link>
      </div>

      {/* Platform-Wide Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Workers</span>
            <HardHat className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totals?.workers || 0}</div>
          <span className="text-[11px] text-slate-400 font-semibold">Registered tradesmen</span>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Contractors</span>
            <Building className="w-4 h-4 text-worklog-teal" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totals?.contractors || 0}</div>
          <span className="text-[11px] text-slate-400 font-semibold">Registered firms</span>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Worksites</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totals?.sites || 0}</div>
          <span className="text-[11px] text-slate-400 font-semibold">Geofenced projects</span>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-rose-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Open Disputes</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-900">{totals?.openDisputes || 0}</div>
          <Link to="/admin/disputes" className="text-[11px] text-rose-800 font-bold hover:underline">
            Review Attendance Flags →
          </Link>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Safety Reports</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-900">{totals?.openSafetyReports || 0}</div>
          <Link to="/admin/disputes" className="text-[11px] text-amber-800 font-bold hover:underline">
            Weather & Hazards →
          </Link>
        </div>
      </div>

      {/* Contractor Dispute Aggregation Chart / Repeat Offenders Matrix */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-worklog-teal" />
              <span>Contractor Dispute Aggregates (Repeat Offender Radar)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Aggregates flagged attendance mismatches and weather safety reports per contractor to surface compliance issues.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Contractor / Firm</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Trust Score</th>
                <th className="px-5 py-3 text-center">Flagged Mismatches</th>
                <th className="px-5 py-3 text-center">Safety Hazards</th>
                <th className="px-5 py-3">Dispute Volume Meter</th>
                <th className="px-5 py-3 text-right">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contractorDisputeStats && contractorDisputeStats.length > 0 ? (
                contractorDisputeStats.map((c) => {
                  const maxIssues = Math.max(1, ...contractorDisputeStats.map((x) => x.totalIssues));
                  const percentage = Math.min(100, Math.round((c.totalIssues / maxIssues) * 100));

                  return (
                    <tr key={c.contractorId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {c.contractorName}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-slate-500">
                        {c.phone}
                      </td>

                      <td className="px-5 py-3.5">
                        <TrustScoreBadge score={c.trustScore} compact label="Trust" />
                      </td>

                      <td className="px-5 py-3.5 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${c.flaggedDisputes > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                          {c.flaggedDisputes}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${c.safetyIssues > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                          {c.safetyIssues}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 w-48">
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full ${
                              c.totalIssues >= 2 ? 'bg-rose-500' : c.totalIssues === 1 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(15, percentage)}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {c.isRepeatOffender ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Repeat Flag Risk</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Compliant</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    No contractor metrics available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
