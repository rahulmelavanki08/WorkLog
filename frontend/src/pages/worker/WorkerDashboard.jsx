import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { workerApi } from '../../services/api';
import TrustScoreBadge from '../../components/TrustScoreBadge';
import DirectJoinSiteModal from '../../components/DirectJoinSiteModal';
import {
  CalendarCheck,
  CreditCard,
  Briefcase,
  QrCode,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  HardHat,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function WorkerDashboard() {
  const { user, refreshUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const res = await workerApi.getDashboard();
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
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
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  const { todayStatus, wages, linkedSites, worker } = dashboardData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Welcome Banner & Trust Reputation */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-worklog-tealDark rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
              WORKER HUB
            </span>
            <span className="text-xs text-slate-300 font-semibold">• {worker?.trades?.join(', ') || 'Skilled Craftsman'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Namaste, {worker?.name || user?.name}! 👋
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Your verified attendance and wage records are protected by WorkLog tamper-proof electronic timestamping.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
          <div>
            <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">Your Trust Score</div>
            <div className="text-2xl font-black text-white">{worker?.trustScore || 100} <span className="text-xs font-normal text-slate-300">/ 100</span></div>
          </div>
          <TrustScoreBadge score={worker?.trustScore || 100} />
        </div>
      </div>

      {/* Primary Action Buttons (Mobile-first large tap targets) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/worker/checkin"
          className="p-4 bg-worklog-teal hover:bg-worklog-tealDark text-white rounded-2xl shadow-lg shadow-teal-950/20 flex items-center justify-between group transition-all hover:scale-[1.01] active:scale-98"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-extrabold">LIVE CHECK-IN</div>
              <div className="text-[11px] text-teal-100">Camera + GPS attendance</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/worker/find-work"
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl shadow-sm flex items-center justify-between group transition-all hover:scale-[1.01] active:scale-98"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-extrabold">FIND NEARBY WORK</div>
              <div className="text-[11px] text-slate-500">Matching your trade skills</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <button
          onClick={() => setJoinModalOpen(true)}
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl shadow-sm flex items-center justify-between group transition-all hover:scale-[1.01] active:scale-98 text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-extrabold">JOIN SITE BY CODE</div>
              <div className="text-[11px] text-slate-500">Enter contractor invite code</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Grid: Today's Shift Status + Wage Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Shift Status Card */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-worklog-teal" />
              <span>Today's Shift Status</span>
            </h2>
            <span className="text-[11px] font-bold text-slate-400">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {todayStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-slate-900">{todayStatus.siteName}</div>
                  <div className="text-xs text-slate-500">{todayStatus.contractorName}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                  todayStatus.confirmationStatus === 'CONFIRMED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : todayStatus.confirmationStatus === 'FLAGGED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {todayStatus.confirmationStatus}
                </span>
              </div>

              {/* Photo & Timestamps */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Check-In Time</span>
                  <span className="text-xs font-bold text-slate-800">
                    {new Date(todayStatus.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {todayStatus.checkInPhoto && (
                    <div className="mt-1 w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-200">
                      <img src={todayStatus.checkInPhoto} alt="Checkin Selfie" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Check-Out Time</span>
                  <span className="text-xs font-bold text-slate-800">
                    {todayStatus.checkOutTime
                      ? new Date(todayStatus.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : 'Active on Site'}
                  </span>
                  {todayStatus.checkOutPhoto ? (
                    <div className="mt-1 w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-200">
                      <img src={todayStatus.checkOutPhoto} alt="Checkout Selfie" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <Link
                      to="/worker/checkin"
                      className="mt-2 inline-block px-2.5 py-1 bg-worklog-teal text-white text-[11px] font-bold rounded-lg shadow-sm"
                    >
                      Check-Out Now
                    </Link>
                  )}
                </div>
              </div>

              {todayStatus.confirmationStatus === 'CONFIRMED' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-bold">Earned Wage Stamped:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">₹{todayStatus.earnedAmount || 850}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">No Check-in Logged Today</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Capture live selfie with GPS to log today's shift</div>
              </div>
              <Link
                to="/worker/checkin"
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-worklog-teal text-white text-xs font-extrabold rounded-xl shadow"
              >
                <span>Start Shift Check-In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Wage Ledger Financial Balance Cards */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-worklog-teal" />
                <span>Wage Ledger & Running Balance</span>
              </h2>
              <p className="text-[11px] text-slate-500">Automatically tracked upon contractor confirmation</p>
            </div>
            <Link
              to="/worker/ledger"
              className="text-xs font-bold text-worklog-teal hover:underline flex items-center space-x-1"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Earned */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Earned (Confirmed)
              </span>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                ₹{(wages?.totalEarned || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-700 mt-1 block">From verified shifts</span>
            </div>

            {/* Total Paid */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Total Paid to Date
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₹{(wages?.totalPaid || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Cash & UPI transfers</span>
            </div>

            {/* Outstanding Balance */}
            <div className="bg-worklog-coralLight border border-worklog-coral/40 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-worklog-coral uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <div className="text-2xl font-black text-worklog-coral mt-1">
                ₹{(wages?.outstandingBalance || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-rose-700 mt-1 block">Owed by contractors</span>
            </div>
          </div>

          {/* Quick Dispute Assistant CTA */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Smart Wage Dispute Assistant</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Generate an official neutral summary packet & downloadable PDF for labor authorities or contractor negotiations.
              </div>
            </div>
            <Link
              to="/worker/report"
              className="px-4 py-2 bg-worklog-teal hover:bg-worklog-tealDark text-white text-xs font-bold rounded-xl shrink-0 text-center shadow"
            >
              Generate Dispute Report
            </Link>
          </div>
        </div>

      </div>

      {/* Linked Sites & Contractors Directory */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <Building className="w-4 h-4 text-worklog-teal" />
            <span>Linked Worksites & Contractors ({linkedSites?.length || 0})</span>
          </h2>
          <button
            onClick={() => setJoinModalOpen(true)}
            className="text-xs font-bold text-worklog-teal hover:underline flex items-center space-x-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Join Another Site</span>
          </button>
        </div>

        {linkedSites && linkedSites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {linkedSites.map((link) => (
              <div
                key={link.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900">{link.site?.name || 'General Project'}</div>
                  <div className="text-xs text-slate-600 flex items-center space-x-2">
                    <span>Contractor: <strong>{link.contractor?.name}</strong></span>
                    <span>•</span>
                    <span className="text-[11px] text-slate-500">{link.contractor?.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      link.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {link.status} LINK
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">{link.site?.siteType || 'Construction'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <TrustScoreBadge score={link.contractor?.trustScore || 90} compact label="Contractor Trust" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            You are not currently linked to any worksite. Apply to open jobs or enter a contractor's invite code above.
          </div>
        )}
      </div>

      {/* Direct Join Site Modal */}
      <DirectJoinSiteModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => {
          loadData();
          refreshUser();
        }}
      />

    </div>
  );
}
