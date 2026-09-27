import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contractorApi } from '../../services/api';
import TrustScoreBadge from '../../components/TrustScoreBadge';
import SiteQrModal from '../../components/SiteQrModal';
import {
  Building2,
  Briefcase,
  UserCheck,
  CreditCard,
  MapPin,
  Users,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  QrCode,
  AlertTriangle,
  ShieldAlert,
  Thermometer,
  CloudRain
} from 'lucide-react';

export default function ContractorDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeQrSite, setActiveQrSite] = useState(null);

  const loadData = async () => {
    try {
      const res = await contractorApi.getDashboard();
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load contractor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-worklog-teal border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Contractor Portal...</span>
        </div>
      </div>
    );
  }

  const { metrics, sites, recentPayments, contractor, trustScoreHistory, safetyReports } = dashboardData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-worklog-tealDark via-slate-900 to-slate-850 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-widest text-teal-300 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800/80">
              CONTRACTOR HUB
            </span>
            <span className="text-xs text-slate-300 font-semibold">• Project Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {contractor?.name || user?.name}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Verify worker check-ins with photo timestamps, monitor weather/climate hazard disputes, and maintain on-time payment records.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
          <div>
            <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">Contractor Trust Score</div>
            <div className="text-2xl font-black text-white">{contractor?.trustScore || 100} <span className="text-xs font-normal text-slate-300">/ 100</span></div>
          </div>
          <TrustScoreBadge score={contractor?.trustScore || 100} />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Sites</span>
            <Building2 className="w-4 h-4 text-worklog-teal" />
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics?.activeSitesCount || 0}</div>
          <span className="text-[11px] text-slate-400 font-semibold">Worksites monitored</span>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Open Jobs</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics?.openJobsCount || 0}</div>
          <span className="text-[11px] text-slate-400 font-semibold">Active job postings</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Check-Ins</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-900">{metrics?.pendingAttendanceCount || 0}</div>
          <Link to="/contractor/confirm" className="text-[11px] text-amber-800 font-bold hover:underline">
            Review Attendance Queue →
          </Link>
        </div>

        {/* Safety & Hazard Alerts Metric */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-rose-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Safety & Hazards</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-900">{metrics?.pendingSafetyReportsCount || 0}</div>
          <Link to="/contractor/safety-reports" className="text-[11px] text-rose-800 font-bold hover:underline">
            View Weather Reports →
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Linked Workers</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics?.activeWorkersCount || 0}</div>
          <span className="text-[11px] text-slate-400 font-semibold">Verified tradesmen</span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Link
          to="/contractor/confirm"
          className="p-4 bg-worklog-teal hover:bg-worklog-tealDark text-white rounded-2xl shadow-md flex items-center justify-between group transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold">CONFIRM ATTENDANCE</div>
              <div className="text-[10px] text-teal-100">{metrics?.pendingAttendanceCount || 0} waiting review</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/contractor/safety-reports"
          className="p-4 bg-white hover:bg-rose-50 border border-slate-200 text-slate-900 rounded-2xl shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-50 text-worklog-coral rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold">SAFETY & WEATHER ALERTS</div>
              <div className="text-[10px] text-slate-500">{metrics?.pendingSafetyReportsCount || 0} heat/rain reports</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/contractor/post-job"
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold">POST NEW JOB</div>
              <div className="text-[10px] text-slate-500">Find skilled workers</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/contractor/payments"
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold">LOG PAYMENTS</div>
              <div className="text-[10px] text-slate-500">Cash / UPI settlements</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Safety & Hazard Incident Stream (if reports exist) */}
      {safetyReports && safetyReports.length > 0 && (
        <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-200/60">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-worklog-coral text-white rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-rose-950">
                  Worker Weather & Hazard Reports Feed
                </h2>
                <p className="text-xs text-rose-700">Recent environmental & safety disputes reported on your worksites</p>
              </div>
            </div>

            <Link
              to="/contractor/safety-reports"
              className="text-xs font-bold text-worklog-coral hover:underline flex items-center space-x-1"
            >
              <span>View All Hazard Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {safetyReports.slice(0, 4).map((report) => (
              <div key={report.id} className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    report.status === 'PENDING' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {report.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{new Date(report.date).toLocaleDateString('en-IN')}</span>
                </div>

                <div className="text-xs">
                  <div className="font-bold text-slate-900 capitalize flex items-center space-x-1.5">
                    {report.riskType === 'extreme_heat' ? <Thermometer className="w-3.5 h-3.5 text-amber-600" /> : <CloudRain className="w-3.5 h-3.5 text-blue-600" />}
                    <span>{report.riskType?.replace('_', ' ')}: {report.siteName}</span>
                  </div>
                  <div className="text-slate-600 mt-1 italic text-[11px]">"{report.details}"</div>
                  {report.temperature && (
                    <div className="text-[10px] font-bold text-rose-700 mt-1">
                      Recorded Temp: {report.temperature}°C {report.weatherDescription && `• ${report.weatherDescription}`}
                    </div>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Worker: <strong>{report.worker?.name}</strong></span>
                  <Link to="/contractor/safety-reports" className="text-worklog-teal font-bold hover:underline">
                    Action →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sites Grid & Trust History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Sites Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-worklog-teal" />
              <span>Your Registered Worksites ({sites?.length || 0})</span>
            </h2>
            <Link to="/contractor/site/new" className="text-xs font-bold text-worklog-teal hover:underline flex items-center space-x-1">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add New Site</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sites && sites.length > 0 ? (
              sites.map((site) => (
                <div key={site.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{site.name}</h3>
                      <div className="text-[11px] text-slate-500 capitalize flex items-center space-x-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{site.siteType || 'Construction'} Site</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full uppercase">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Invite Code</span>
                      <span className="font-mono text-xs font-black text-slate-900">{site.inviteCode}</span>
                    </div>
                    <button
                      onClick={() => setActiveQrSite(site)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center space-x-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View QR</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-6 text-xs text-slate-400">
                No sites registered yet. Click "Add New Site" to get started.
              </div>
            )}
          </div>
        </div>

        {/* Trust Score History Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-worklog-teal" />
              <span>Trust Score Timeline</span>
            </h2>
            <span className="text-xs font-black text-slate-900">{contractor?.trustScore || 100} / 100</span>
          </div>

          <div className="space-y-3">
            {trustScoreHistory && trustScoreHistory.length > 0 ? (
              trustScoreHistory.map((h) => (
                <div key={h.id} className="text-xs flex items-start justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800">{h.reason}</div>
                    <div className="text-[10px] text-slate-400">{new Date(h.date).toLocaleDateString('en-IN')}</div>
                  </div>
                  <span className={`font-black text-xs px-2 py-0.5 rounded-full ${
                    h.change >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {h.change > 0 ? `+${h.change}` : h.change}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                Baseline trust score active (100 pts).
              </div>
            )}
          </div>
        </div>

      </div>

      {/* QR Code Modal */}
      <SiteQrModal
        isOpen={!!activeQrSite}
        onClose={() => setActiveQrSite(null)}
        site={activeQrSite}
      />

    </div>
  );
}
