import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TrustScoreBadge from './TrustScoreBadge';
import {
  Briefcase,
  CalendarCheck,
  CreditCard,
  FileText,
  Home,
  LogOut,
  MapPin,
  Menu,
  PlusCircle,
  Shield,
  ShieldAlert,
  Users,
  X,
  UserCheck,
  Layers,
  Thermometer,
  CloudRain
} from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Nav links based on Role
  const workerNav = [
    { name: 'Dashboard', path: '/worker/dashboard', icon: Home },
    { name: 'Find Work', path: '/worker/find-work', icon: Briefcase },
    { name: 'Applications', path: '/worker/my-applications', icon: Layers },
    { name: 'Live Check-In', path: '/worker/checkin', icon: CalendarCheck, highlight: true },
    { name: 'Wage Ledger', path: '/worker/ledger', icon: CreditCard },
    { name: 'Dispute Report', path: '/worker/report', icon: FileText },
  ];

  const contractorNav = [
    { name: 'Dashboard', path: '/contractor/dashboard', icon: Home },
    { name: 'Sites', path: '/contractor/site/new', icon: MapPin },
    { name: 'Post Job', path: '/contractor/post-job', icon: PlusCircle },
    { name: 'Manage Jobs', path: '/contractor/manage-jobs', icon: Users },
    { name: 'Confirm Attendance', path: '/contractor/confirm', icon: UserCheck, highlight: true },
    { name: 'Safety & Weather', path: '/contractor/safety-reports', icon: ShieldAlert },
    { name: 'Log Payments', path: '/contractor/payments', icon: CreditCard },
  ];

  const adminNav = [
    { name: 'Overview', path: '/admin/dashboard', icon: Home },
    { name: 'Disputes & Safety', path: '/admin/disputes', icon: ShieldAlert, highlight: true },
    { name: 'Platform Links', path: '/admin/links', icon: Users },
  ];

  const currentNav = role === 'WORKER' ? workerNav : role === 'CONTRACTOR' ? contractorNav : role === 'ADMIN' ? adminNav : [];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <Link to={role === 'WORKER' ? '/worker/dashboard' : role === 'CONTRACTOR' ? '/contractor/dashboard' : role === 'ADMIN' ? '/admin/dashboard' : '/login'} className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-worklog-teal flex items-center justify-center text-white font-bold text-xl shadow-md">
                W
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">WorkLog</span>
                  {role && (
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full ${
                      role === 'WORKER' ? 'bg-indigo-100 text-indigo-700' :
                      role === 'CONTRACTOR' ? 'bg-teal-100 text-teal-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {role}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold tracking-wider text-worklog-teal uppercase -mt-0.5">
                  FIND IT, PROVE IT
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              {currentNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'bg-worklog-teal text-white shadow-sm'
                        : item.highlight
                        ? 'text-worklog-teal bg-worklog-tealLight/60 hover:bg-worklog-tealLight'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Profile */}
          {user ? (
            <div className="hidden md:flex items-center space-x-3">
              {/* Trust Score (Only for Worker and Contractor, never for Admin) */}
              {role !== 'ADMIN' && (
                <TrustScoreBadge score={user.trustScore} userId={user.id} />
              )}

              {/* User Name & Logout */}
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-500">{user.phone}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-white bg-worklog-teal hover:bg-worklog-tealDark rounded-lg shadow-sm transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          {user && (
            <div className="flex items-center space-x-2 md:hidden">
              {role !== 'ADMIN' && (
                <TrustScoreBadge score={user.trustScore} compact />
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-800" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {/* User Info Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-sm font-bold text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500">{user.phone} • {user.role}</div>
            </div>
            {role !== 'ADMIN' && (
              <TrustScoreBadge score={user.trustScore} />
            )}
          </div>

          {/* Nav Links */}
          <div className="grid grid-cols-1 gap-1">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-worklog-teal text-white shadow-sm'
                      : item.highlight
                      ? 'text-worklog-teal bg-worklog-tealLight/70'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
