import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, AlertTriangle, ShieldAlert, CheckCircle, X, Thermometer, Wind } from 'lucide-react';
import { workerApi, weatherApi } from '../services/api';

export default function WeatherRiskBanner({
  siteId,
  siteName = 'Outdoor Construction Site',
  siteType = 'construction',
  lat,
  lng,
  attendanceId,
  onReportSubmitted,
}) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const [riskType, setRiskType] = useState('extreme_heat');
  const [details, setDetails] = useState('');

  // Fetch weather on mount / lat lng change
  useEffect(() => {
    async function loadWeather() {
      if (lat == null || lng == null) {
        setLoading(false);
        return;
      }

      try {
        const res = await weatherApi.getSafetyCheck(lat, lng);
        if (res.data.success) {
          setWeather(res.data.weather);
        }
      } catch (err) {
        console.warn('Weather safety fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, [lat, lng]);

  const handleSubmitSafetyReport = async (e) => {
    e.preventDefault();
    if (!siteId) {
      alert('A site ID is required to log a safety condition.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await workerApi.reportSafety({
        siteId,
        attendanceId: attendanceId || null,
        riskType,
        temperature: weather?.temperature || null,
        weatherDescription: weather?.condition || null,
        details: details || `Worker submitted safety hazard report for ${riskType}`,
      });

      if (res.data.success) {
        setSuccessMessage('Safety hazard report submitted to labor oversight administrators and contractor.');
        setTimeout(() => {
          setModalOpen(false);
          setSuccessMessage(null);
          setDetails('');
          if (onReportSubmitted) onReportSubmitted(res.data.report);
        }, 1800);
      }
    } catch (err) {
      alert('Failed to submit report: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const isOutdoor = ['construction', 'agriculture', 'roadwork'].includes(siteType?.toLowerCase());
  const isHeatRisk = weather?.temperature >= 40.0 || weather?.isHeatRisk;
  const isRainRisk = weather?.isRainRisk;
  const hasHazard = isHeatRisk || isRainRisk;

  return (
    <div className="w-full space-y-2">
      {/* Weather Safety Status Bar */}
      <div
        className={`w-full rounded-2xl p-4 border transition-all ${
          hasHazard
            ? 'bg-worklog-coralLight border-worklog-coral/40 text-slate-900 shadow-md'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div
              className={`p-2.5 rounded-xl mt-0.5 ${
                hasHazard
                  ? 'bg-worklog-coral text-white'
                  : 'bg-worklog-tealLight text-worklog-teal'
              }`}
            >
              {isRainRisk ? (
                <CloudRain className="w-6 h-6 animate-bounce" />
              ) : isHeatRisk ? (
                <Sun className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
              ) : (
                <Thermometer className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Live Safety Check • {isOutdoor ? 'Outdoor Worksite' : 'Indoor Site'}
                </span>
                {hasHazard && (
                  <span className="bg-worklog-coral text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    Hazard Active
                  </span>
                )}
              </div>

              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {weather ? (
                  <span>
                    {weather.condition} — <strong>{weather.temperature}°C</strong>
                    {weather.precipitation > 0 && ` (${weather.precipitation}mm rain)`}
                  </span>
                ) : (
                  <span>Fetching live weather for coordinates...</span>
                )}
              </div>

              {hasHazard && (
                <p className="text-xs text-worklog-coral font-medium mt-1">
                  {weather.riskMessage ||
                    (isHeatRisk
                      ? 'Severe Heat Wave (>40°C): Mandatory hydration intervals & shaded rest required.'
                      : 'Severe Rain Alert: Slippery scaffolds & high electrical hazard risk.')}
                </p>
              )}
            </div>
          </div>

          {/* One-tap Report Unsafe Condition Button */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-worklog-coral hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Report Unsafe Condition</span>
            </button>
          </div>
        </div>
      </div>

      {/* Safety Report Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-worklog-coralLight text-worklog-coral rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Report Unsafe Work Condition</h3>
                <p className="text-xs text-slate-500">Site: {siteName} • Stamped with current GPS & time</p>
              </div>
            </div>

            {successMessage ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center space-x-3 my-4">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-xs font-bold">{successMessage}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitSafetyReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hazard Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'extreme_heat', label: 'Extreme Heat (>40°C)' },
                      { id: 'heavy_rain', label: 'Flooding / Heavy Rain' },
                      { id: 'structural_hazard', label: 'Scaffolding / Falling Hazard' },
                      { id: 'no_safety_gear', label: 'Missing PPE / Safety Gear' },
                      { id: 'electrical_risk', label: 'Live Wire / Electrical Hazard' },
                      { id: 'other', label: 'Other Hazardous Condition' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRiskType(item.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                          riskType === item.id
                            ? 'bg-worklog-coral text-white border-worklog-coral shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Details / Observations (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe specific safety risk (e.g., no shade net, slippery scaffolding, exposed electrical wires)..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-worklog-coral focus:border-transparent outline-none"
                  />
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 border border-slate-200">
                  📌 <strong>Worker Protection Notice:</strong> This report is logged into the permanent dispute evidence ledger and shared with platform safety supervisors. It will not reduce your personal Trust Score.
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-2/3 py-2.5 rounded-xl bg-worklog-coral hover:bg-rose-700 text-white text-xs font-bold shadow transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Submitting Report...' : 'SUBMIT SAFETY REPORT'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
