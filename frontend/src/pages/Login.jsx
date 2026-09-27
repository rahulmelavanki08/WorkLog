import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { ShieldCheck, Phone, Key, ArrowRight, UserCheck, HardHat, Building, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { loginWithToken, demoLogin } = useAuth();

  const [selectedRole, setSelectedRole] = useState('WORKER'); // 'WORKER' | 'CONTRACTOR' | 'ADMIN'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authApi.requestOtp(phone.trim());
      if (res.data.success) {
        setOtpSent(true);
        setSimulatedOtp(res.data.otp || '123456');
        setOtp(res.data.otp || '123456'); // Pre-fill for instant frictionless demo experience!
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the OTP code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authApi.verifyOtp(phone.trim(), otp.trim(), selectedRole);
      if (res.data.success) {
        if (res.data.isNewUser) {
          // Redirect to register with phone prefilled
          navigate(`/register?role=${selectedRole}&phone=${encodeURIComponent(phone.trim())}`);
        } else {
          loginWithToken(res.data.token, res.data.user);
          if (res.data.user.role === 'WORKER') navigate('/worker/dashboard');
          else if (res.data.user.role === 'CONTRACTOR') navigate('/contractor/dashboard');
          else if (res.data.user.role === 'ADMIN') navigate('/admin/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Demo Login
  const handleQuickDemo = async (role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await demoLogin(role);
      if (res.success) {
        if (role === 'WORKER') navigate('/worker/dashboard');
        else if (role === 'CONTRACTOR') navigate('/contractor/dashboard');
        else if (role === 'ADMIN') navigate('/admin/dashboard');
      } else {
        setError(res.error || 'Demo login failed');
      }
    } catch (err) {
      setError('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-worklog-teal text-white shadow-xl shadow-teal-950/20 transform hover:scale-105 transition-transform">
            <span className="font-extrabold text-3xl">W</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            WorkLog
          </h1>
          <div className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-200">
            <span className="text-xs font-black tracking-widest text-worklog-teal uppercase">
              FIND IT, PROVE IT
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Worker-first digital employment platform verifying daily attendance, wages, and safety for India's informal workforce.
          </p>
        </div>

        {/* 1-Click Instant Demo Login (For fast evaluation) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Instant Demo Logins</span>
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Pre-seeded
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemo('WORKER')}
              disabled={loading}
              className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-left transition-all hover:scale-[1.02] active:scale-95"
            >
              <HardHat className="w-4 h-4 text-indigo-700 mb-1" />
              <div className="text-xs font-bold text-indigo-900 leading-tight">Worker</div>
              <div className="text-[10px] text-indigo-600 truncate">Ramesh Kumar</div>
            </button>

            <button
              onClick={() => handleQuickDemo('CONTRACTOR')}
              disabled={loading}
              className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100 text-left transition-all hover:scale-[1.02] active:scale-95"
            >
              <Building className="w-4 h-4 text-teal-800 mb-1" />
              <div className="text-xs font-bold text-teal-950 leading-tight">Contractor</div>
              <div className="text-[10px] text-teal-700 truncate">Rajesh Sharma</div>
            </button>

            <button
              onClick={() => handleQuickDemo('ADMIN')}
              disabled={loading}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-left transition-all hover:scale-[1.02] active:scale-95"
            >
              <ShieldAlert className="w-4 h-4 text-amber-800 mb-1" />
              <div className="text-xs font-bold text-amber-950 leading-tight">Admin</div>
              <div className="text-[10px] text-amber-700 truncate">Officer Meera</div>
            </button>
          </div>
        </div>

        {/* Standard Phone + OTP Form */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-5">
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'WORKER', label: 'Worker', icon: HardHat },
                { id: 'CONTRACTOR', label: 'Contractor', icon: Building },
                { id: 'ADMIN', label: 'Admin', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = selectedRole === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(tab.id);
                      if (tab.id === 'WORKER') setPhone('9800000001');
                      else if (tab.id === 'CONTRACTOR') setPhone('9876543210');
                      else if (tab.id === 'ADMIN') setPhone('9999999999');
                    }}
                    className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {!otpSent ? (
            /* Step 1: Phone Input */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number (India)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="e.g. 9800000001"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-worklog-teal focus:border-transparent outline-none transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Prototype mode: simulated SMS OTP will be generated instantly.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-3.5 px-4 bg-worklog-teal hover:bg-worklog-tealDark disabled:opacity-50 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-teal-950/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-98"
              >
                <span>{loading ? 'Sending OTP...' : 'GET SECURE OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Step 2: OTP Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Enter 6-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs text-worklog-teal font-semibold hover:underline"
                  >
                    Change Phone
                  </button>
                </div>

                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:ring-2 focus:ring-worklog-teal focus:border-transparent outline-none"
                  />
                </div>

                {simulatedOtp && (
                  <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between font-medium">
                    <span className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Simulated Prototype OTP:</span>
                    </span>
                    <span className="font-mono font-black text-xs bg-emerald-200 px-2 py-0.5 rounded">
                      {simulatedOtp}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full py-3.5 px-4 bg-worklog-teal hover:bg-worklog-tealDark disabled:opacity-50 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-teal-950/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-98"
              >
                <span>{loading ? 'Verifying...' : 'VERIFY & SIGN IN'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Registration Link */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500">New to WorkLog? </span>
            <Link
              to={`/register?role=${selectedRole}`}
              className="text-xs font-bold text-worklog-teal hover:underline ml-1"
            >
              Register as a {selectedRole.toLowerCase()}
            </Link>
          </div>
        </div>

        {/* Trust & Guarantee Banner */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-worklog-teal" />
            <span>Tamper-Resistant Photo & GPS Attendance Verification</span>
          </div>
        </div>

      </div>
    </div>
  );
}
