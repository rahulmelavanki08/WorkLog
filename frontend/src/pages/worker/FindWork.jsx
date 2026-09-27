import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { workerApi } from '../../services/api';
import TrustScoreBadge from '../../components/TrustScoreBadge';
import confetti from 'canvas-confetti';
import {
  Briefcase,
  MapPin,
  Clock,
  Filter,
  CheckCircle,
  ArrowUpDown,
  Layers,
  Sparkles,
  Search,
  Navigation,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

const TRADE_LIST = [
  'All Trades',
  'Plumber',
  'Electrician',
  'Painter',
  'Mason',
  'Centering Worker',
  'Carpenter',
  'Welder',
  'Bar Bender',
  'Tile Layer',
  'Helper/Unskilled Labor',
  'Driver',
];

export default function FindWork() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('nearest'); // 'nearest' | 'wage_high' | 'newest'
  const [selectedTrade, setSelectedTrade] = useState('All Trades');
  const [maxDistance, setMaxDistance] = useState(25);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [appliedSuccessId, setAppliedSuccessId] = useState(null);

  // User GPS
  const [userLocation, setUserLocation] = useState({ lat: 12.9716, lng: 77.5946 });

  // Auto-fetch user location from browser Geolocation API
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn('Geolocation prompt dismissed, using profile default:', err);
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await workerApi.findWork({
        sortBy,
        filterTrade: selectedTrade === 'All Trades' ? undefined : selectedTrade,
        maxDistance,
        lat: userLocation.lat,
        lng: userLocation.lng,
      });

      if (res.data.success) {
        setJobs(res.data.jobs);
      }
    } catch (err) {
      console.error('Failed to load jobs feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [sortBy, selectedTrade, maxDistance, userLocation]);

  const handleApply = async (job) => {
    setApplyingJobId(job.id);
    try {
      const res = await workerApi.applyJob(job.id, userLocation.lat, userLocation.lng);
      if (res.data.success) {
        setAppliedSuccessId(job.id);
        // Fire celebration confetti!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#0F6E56', '#7F77DD', '#10B981', '#F59E0B'],
        });

        // Update local job state to reflect application
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  myApplication: {
                    id: res.data.application.id,
                    status: 'PENDING',
                    appliedAt: new Date().toISOString(),
                  },
                }
              : j
          )
        );
      }
    } catch (err) {
      alert('Application failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Haversine Proximity Engine
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Live Matching</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Find Skilled Jobs Near You
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Matching trade requirements and distance from your verified location.
          </p>
        </div>

        <Link
          to="/worker/my-applications"
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow self-start sm:self-auto"
        >
          <Layers className="w-4 h-4" />
          <span>My Applications</span>
        </Link>
      </div>

      {/* Filter & Sort Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Trade Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Trade
            </label>
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
            >
              {TRADE_LIST.map((trade) => (
                <option key={trade} value={trade}>
                  {trade}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sort Job Postings
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'nearest', label: 'Nearest' },
                { id: 'wage_high', label: 'Highest Wage' },
                { id: 'newest', label: 'Newest' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === s.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Distance Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Max Distance (Radius)
              </label>
              <span className="text-xs font-black text-indigo-600">{maxDistance} km</span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              step="2"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-worklog-teal cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* Job Feed List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-worklog-teal border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-xs font-bold text-slate-500">Calculating Proximities & Matching Trades...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Open Jobs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try expanding your search radius slider or selecting "All Trades" to view more contractor postings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const hasApplied = !!job.myApplication;
            return (
              <div
                key={job.id}
                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-card-hover border border-slate-200/90 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Trade Match Badge */}
                {job.matchesTrade && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Skill Match</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Contractor Info & Trust */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-worklog-teal font-bold flex items-center justify-center text-xs border border-teal-100">
                        {job.contractor.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          {job.contractor.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{job.siteName}</div>
                      </div>
                    </div>

                    <TrustScoreBadge score={job.contractor.trustScore} compact label="Trust" />
                  </div>

                  {/* Title & Wage */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {job.title}
                    </h3>
                    <div className="flex items-baseline space-x-1 mt-1 text-emerald-700 font-black text-xl">
                      <span>₹{job.dailyWage}</span>
                      <span className="text-xs font-bold text-slate-500">/ day</span>
                    </div>
                  </div>

                  {/* Trade tags */}
                  <div className="flex flex-wrap gap-1">
                    {job.requiredTrades.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Distance & Duration Pills */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-semibold">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-worklog-teal shrink-0" />
                      <span>
                        {job.distanceKm != null ? `${job.distanceKm} km away` : 'Proximity calculated'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="capitalize">{job.durationType?.replace('_', ' ') || 'Multi-day'}</span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-2">
                  {hasApplied ? (
                    <div className="w-full py-3 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center justify-center space-x-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="uppercase">Applied ({job.myApplication.status})</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApply(job)}
                      disabled={applyingJobId === job.id}
                      className="w-full py-3.5 px-4 rounded-2xl bg-worklog-teal hover:bg-worklog-tealDark disabled:opacity-50 text-white text-xs font-black tracking-wide shadow-md shadow-teal-950/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-98"
                    >
                      <span>{applyingJobId === job.id ? 'APPLYING...' : '1-TAP APPLY FOR JOB'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
