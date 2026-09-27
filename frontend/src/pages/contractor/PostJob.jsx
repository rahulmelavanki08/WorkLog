import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractorApi } from '../../services/api';
import {
  Briefcase,
  Plus,
  Check,
  MapPin,
  Calendar,
  IndianRupee,
  Users,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';

const FIXED_TRADES = [
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

export default function PostJob() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [selectedTrades, setSelectedTrades] = useState(['Mason']);
  const [workersNeeded, setWorkersNeeded] = useState(2);
  const [dailyWage, setDailyWage] = useState(900);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationType, setDurationType] = useState('multi_day');
  const [siteId, setSiteId] = useState('');
  const [lat, setLat] = useState(12.9716);
  const [lng, setLng] = useState(77.5946);

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);

  // GPS Detection State
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null); // { type: 'success' | 'error', message: string }

  // Auto-Detect Current GPS Location
  const autoDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus({
        type: 'error',
        message: 'Geolocation is not supported by your browser. Please enter coordinates manually.',
      });
      return;
    }

    setIsLocating(true);
    setGpsStatus(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detectedLat = Number(pos.coords.latitude.toFixed(6));
        const detectedLng = Number(pos.coords.longitude.toFixed(6));
        setLat(detectedLat);
        setLng(detectedLng);
        setIsLocating(false);
        setGpsStatus({
          type: 'success',
          message: `GPS Auto-Detected: ${detectedLat}, ${detectedLng} (Accuracy: ±${Math.round(pos.coords.accuracy || 15)}m)`,
        });
      },
      (err) => {
        console.warn('[PostJob.autoDetectLocation] Geolocation error:', err);
        setIsLocating(false);
        let msg = 'Unable to retrieve your location.';
        if (err.code === 1) msg = 'Location permission was denied. Please allow location access in your browser.';
        else if (err.code === 2) msg = 'Location unavailable. Please check your network/GPS settings.';
        else if (err.code === 3) msg = 'Location request timed out. Please try again.';

        setGpsStatus({
          type: 'error',
          message: msg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  useEffect(() => {
    async function loadSites() {
      try {
        const res = await contractorApi.getSites();
        if (res.data.success && res.data.sites.length > 0) {
          setSites(res.data.sites);
          setSiteId(res.data.sites[0].id);
          setLat(res.data.sites[0].lat);
          setLng(res.data.sites[0].lng);
        } else {
          // If no sites exist yet, auto-detect location
          autoDetectLocation();
        }
      } catch (err) {
        console.error('Failed to load sites:', err);
      }
    }
    loadSites();
  }, []);

  const handleSiteChange = (selectedId) => {
    setSiteId(selectedId);
    if (selectedId === 'CUSTOM_GPS') {
      // Trigger live GPS detection
      autoDetectLocation();
      return;
    }

    const found = sites.find((s) => s.id === selectedId);
    if (found) {
      setLat(found.lat);
      setLng(found.lng);
      setGpsStatus({
        type: 'success',
        message: `Coordinates synced from site: "${found.name}" (${found.lat.toFixed(4)}, ${found.lng.toFixed(4)})`,
      });
    }
  };

  const toggleTrade = (trade) => {
    if (selectedTrades.includes(trade)) {
      if (selectedTrades.length === 1) return;
      setSelectedTrades(selectedTrades.filter((t) => t !== trade));
    } else {
      setSelectedTrades([...selectedTrades, trade]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || selectedTrades.length === 0) return;

    setLoading(true);
    try {
      const res = await contractorApi.postJob({
        title: title.trim(),
        requiredTrades: selectedTrades,
        workersNeeded: Number(workersNeeded),
        dailyWage: Number(dailyWage),
        startDate,
        durationType,
        siteId: siteId === 'CUSTOM_GPS' ? null : (siteId || null),
        lat: Number(lat),
        lng: Number(lng),
      });

      if (res.data.success) {
        navigate('/contractor/manage-jobs');
      }
    } catch (err) {
      alert('Failed to post job: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Post an Open Skilled Job
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Broadcast open vacancies to skilled trade workers filtered by GPS proximity.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Job Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Job Title / Task Description *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Experienced Mason for Foundation & Concrete Pouring"
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-worklog-teal outline-none"
            />
          </div>

          {/* Trade Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Required Trade / Skills * (Multiple Allowed)
              </label>
              <span className="text-[11px] text-worklog-teal font-bold">{selectedTrades.length} selected</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FIXED_TRADES.map((trade) => {
                const isSelected = selectedTrades.includes(trade);
                return (
                  <button
                    key={trade}
                    type="button"
                    onClick={() => toggleTrade(trade)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-worklog-teal text-white border-worklog-teal shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{trade}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wage & Workers Needed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Daily Wage Offered (₹ / day) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="200"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-worklog-teal outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Number of Workers Needed *
              </label>
              <input
                type="number"
                required
                min="1"
                max="50"
                value={workersNeeded}
                onChange={(e) => setWorkersNeeded(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-worklog-teal outline-none"
              />
            </div>
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-worklog-teal outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Duration Type *
              </label>
              <select
                value={durationType}
                onChange={(e) => setDurationType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
              >
                <option value="single_day">Single Day Shift</option>
                <option value="multi_day">Multi-Day Project (1 - 4 weeks)</option>
                <option value="ongoing">Ongoing Long-term Contract</option>
              </select>
            </div>
          </div>

          {/* Worksite & Location Section */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Worksite & Location Source *
              </label>
              <select
                value={siteId}
                onChange={(e) => handleSiteChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    🏢 {s.name} ({s.siteType}) — GPS: {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                  </option>
                ))}
                <option value="CUSTOM_GPS">📍 Use Custom Location / Auto-Detect Device GPS</option>
              </select>
            </div>

            {/* GPS Auto-Detect Button */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={autoDetectLocation}
                  disabled={isLocating}
                  className="flex-1 py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-sm"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                      <span>Detecting Real-Time Device GPS...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 text-emerald-700" />
                      <span>Auto-Detect Current GPS Location</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Message */}
              {gpsStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
                    gpsStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {gpsStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{gpsStatus.message}</span>
                </div>
              )}
            </div>

            {/* Coordinates Display & Manual Overrides */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-worklog-teal outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-worklog-teal outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-worklog-teal hover:bg-worklog-tealDark disabled:opacity-50 text-white font-black text-sm tracking-wide rounded-2xl shadow-xl shadow-teal-950/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-98"
          >
            <Briefcase className="w-5 h-5" />
            <span>{loading ? 'PUBLISHING JOB...' : 'PUBLISH JOB POSTING'}</span>
          </button>
        </form>
      </div>

    </div>
  );
}
