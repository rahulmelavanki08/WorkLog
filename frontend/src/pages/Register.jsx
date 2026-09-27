import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { HardHat, Building, Check, Plus, ArrowRight, ShieldCheck, Camera, Sparkles, Navigation } from 'lucide-react';

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

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const initialRole = (searchParams.get('role') || 'WORKER').toUpperCase();
  const initialPhone = searchParams.get('phone') || '';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(initialPhone);
  const [companyName, setCompanyName] = useState('');

  // Worker specifics
  const [selectedTrades, setSelectedTrades] = useState(['Mason']);
  const [otherTrade, setOtherTrade] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [yearsExperience, setYearsExperience] = useState(3);
  const [searchRadius, setSearchRadius] = useState(15);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleTrade = (trade) => {
    if (selectedTrades.includes(trade)) {
      if (selectedTrades.length === 1 && !isOtherSelected) return; // Keep at least one
      setSelectedTrades(selectedTrades.filter((t) => t !== trade));
    } else {
      setSelectedTrades([...selectedTrades, trade]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Please fill in your full name and phone number.');
      return;
    }

    if (role === 'WORKER') {
      const allTrades = [...selectedTrades];
      if (isOtherSelected && otherTrade.trim()) {
        allTrades.push(otherTrade.trim());
      }

      if (allTrades.length === 0) {
        setError('Please select at least one trade or skill.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await authApi.registerWorker({
          name: name.trim(),
          phone: phone.trim(),
          trades: allTrades,
          otherTrade: isOtherSelected ? otherTrade.trim() : null,
          yearsExperience: Number(yearsExperience) || 1,
          searchRadius: Number(searchRadius) || 10,
          profilePhoto,
        });

        if (res.data.success) {
          loginWithToken(res.data.token, res.data.user);
          navigate('/worker/dashboard');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Worker registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      // Contractor Registration
      setLoading(true);
      setError(null);
      try {
        const res = await authApi.registerContractor({
          name: `${name.trim()} (${companyName.trim() || 'Contractor'})`,
          phone: phone.trim(),
          companyName: companyName.trim(),
        });

        if (res.data.success) {
          loginWithToken(res.data.token, res.data.user);
          navigate('/contractor/dashboard');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Contractor registration failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl w-full mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <Link to="/login" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-worklog-teal flex items-center justify-center text-white font-bold text-xl shadow-md">
              W
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">WorkLog</span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Your Verified Account
          </h2>
          <p className="text-xs text-slate-500">
            Join the digital employment platform built for India's skilled workforce.
          </p>
        </div>

        {/* Role Switcher in Registration */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-6">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('WORKER')}
              className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
                role === 'WORKER'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>I am a Worker</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('CONTRACTOR')}
              className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
                role === 'CONTRACTOR'
                  ? 'bg-worklog-teal text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>I am a Contractor / Builder</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Common Fields: Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-worklog-teal focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-worklog-teal focus:border-transparent outline-none"
                />
              </div>
            </div>

            {role === 'CONTRACTOR' ? (
              /* Contractor Specifics */
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company / Firm / Site Name(s) *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Infrastructure & Builders"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-worklog-teal focus:border-transparent outline-none"
                />
              </div>
            ) : (
              /* Worker Specifics: Multi-Select Trades & Experience */
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select Your Trade / Skills * (Multiple Allowed)
                    </label>
                    <span className="text-[11px] text-indigo-600 font-bold">
                      {selectedTrades.length + (isOtherSelected ? 1 : 0)} selected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FIXED_TRADES.map((trade) => {
                      const isSelected = selectedTrades.includes(trade);
                      return (
                        <button
                          key={trade}
                          type="button"
                          onClick={() => toggleTrade(trade)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{trade}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                        </button>
                      );
                    })}

                    {/* Other Trade Fallback */}
                    <button
                      type="button"
                      onClick={() => setIsOtherSelected(!isOtherSelected)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all ${
                        isOtherSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Other (Specify)</span>
                      {isOtherSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                    </button>
                  </div>

                  {isOtherSelected && (
                    <div className="mt-2.5 animate-in fade-in">
                      <input
                        type="text"
                        required
                        value={otherTrade}
                        onChange={(e) => setOtherTrade(e.target.value)}
                        placeholder="Enter your custom trade or specialty (e.g. Scaffolder, Stone Polisher)..."
                        className="w-full px-4 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Years Experience & Search Radius */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Years of Experience ({yearsExperience} yrs)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                      <span>1 yr (Junior)</span>
                      <span>10 yrs</span>
                      <span>25+ yrs (Master)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Job Search Radius</span>
                      <span className="text-indigo-600 font-extrabold">{searchRadius} km</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                      <span>5 km (Local)</span>
                      <span>25 km</span>
                      <span>50 km (Citywide)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-worklog-teal hover:bg-worklog-tealDark disabled:opacity-50 text-white text-sm font-black tracking-wide rounded-xl shadow-xl shadow-teal-950/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-98"
            >
              <span>{loading ? 'CREATING ACCOUNT...' : `COMPLETE ${role} REGISTRATION`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Login Footer */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500">Already registered? </span>
            <Link to="/login" className="text-xs font-bold text-worklog-teal hover:underline ml-1">
              Sign In to WorkLog
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
