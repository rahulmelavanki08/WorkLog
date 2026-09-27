import React, { useState, useEffect } from 'react';
import { contractorApi } from '../../services/api';
import SiteQrModal from '../../components/SiteQrModal';
import {
  Building2,
  MapPin,
  QrCode,
  Plus,
  CheckCircle2,
  Navigation,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function NewSite() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeQrSite, setActiveQrSite] = useState(null);

  const [name, setName] = useState('');
  const [siteType, setSiteType] = useState('construction');
  const [lat, setLat] = useState(12.9716);
  const [lng, setLng] = useState(77.5946);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null);

  const fetchSites = async () => {
    try {
      const res = await contractorApi.getSites();
      if (res.data.success) {
        setSites(res.data.sites);
      }
    } catch (err) {
      console.error('Failed to load sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus({
        type: 'error',
        message: 'Geolocation is not supported by your browser.',
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
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        let msg = 'Unable to retrieve location.';
        if (err.code === 1) msg = 'Location permission denied by browser.';
        else if (err.code === 2) msg = 'Location signal unavailable.';
        else if (err.code === 3) msg = 'Location request timed out.';

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
    fetchSites();
    detectLocation();
  }, []);

  const handleCreateSite = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await contractorApi.createSite({
        name: name.trim(),
        siteType,
        lat: Number(lat),
        lng: Number(lng),
      });

      if (res.data.success) {
        setSuccessMessage(`Site "${res.data.site.name}" created with code ${res.data.site.inviteCode}`);
        setName('');
        fetchSites();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      alert('Failed to create site: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Worksites & QR Onboarding
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Create projects and share invite codes/QR with workers for automated GPS geofenced check-ins.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Site Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-worklog-teal" />
            <span>Register New Worksite</span>
          </h2>

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateSite} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Site / Project Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Metro Station Pier 4 Site"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Site Type (Drives Weather Safety Checks) *
              </label>
              <select
                value={siteType}
                onChange={(e) => setSiteType(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-worklog-teal"
              >
                <option value="construction">Construction (Outdoor Risk Check Active)</option>
                <option value="agriculture">Agriculture (Outdoor Risk Check Active)</option>
                <option value="roadwork">Roadwork & Infrastructure (Outdoor Risk Check Active)</option>
                <option value="retail">Retail / Warehouse (Indoor)</option>
                <option value="other">Other Worksite</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Outdoor sites trigger Open-Meteo safety alerts for extreme heat (&gt;40°C) and heavy rain.
              </span>
            </div>

            {/* GPS Auto-Detect Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={detectLocation}
                disabled={isLocating}
                className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-98"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                    <span>Detecting Real-Time GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 text-emerald-700" />
                    <span>Auto-Detect Current GPS Location</span>
                  </>
                )}
              </button>

              {gpsStatus && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 ${
                    gpsStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {gpsStatus.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="text-[11px]">{gpsStatus.message}</span>
                </div>
              )}
            </div>

            {/* GPS Coordinates */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
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
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
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
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-worklog-teal hover:bg-worklog-tealDark disabled:opacity-50 text-white text-xs font-black rounded-xl shadow transition-all"
            >
              {submitting ? 'Creating Site...' : 'CREATE WORKSITE & GENERATE CODE'}
            </button>
          </form>
        </div>

        {/* Existing Sites List */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-worklog-teal" />
            <span>Active Worksites ({sites.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.map((site) => (
              <div
                key={site.id}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900 leading-tight">{site.name}</h3>
                    <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full capitalize">
                      {site.siteType}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>GPS: {site.lat.toFixed(4)}, {site.lng.toFixed(4)}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Direct Invite Code</span>
                    <span className="font-mono text-sm font-black text-worklog-teal">{site.inviteCode}</span>
                  </div>

                  <button
                    onClick={() => setActiveQrSite(site)}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Show QR</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* QR Modal */}
      <SiteQrModal
        isOpen={!!activeQrSite}
        onClose={() => setActiveQrSite(null)}
        site={activeQrSite}
      />

    </div>
  );
}
