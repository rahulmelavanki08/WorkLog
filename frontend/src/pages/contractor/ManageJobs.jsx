import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contractorApi } from '../../services/api';
import TrustScoreBadge from '../../components/TrustScoreBadge';
import {
  Briefcase,
  Users,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  PlusCircle,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'trust'
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [revealedPhones, setRevealedPhones] = useState({});

  const fetchJobs = async () => {
    try {
      const res = await contractorApi.getManageJobs({ sortBy });
      if (res.data.success) {
        setJobs(res.data.jobs);
        if (res.data.jobs.length > 0 && !expandedJobId) {
          setExpandedJobId(res.data.jobs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load jobs & applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [sortBy]);

  const toggleJobExpand = (jobId) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      const res = await contractorApi.updateJobStatus(jobId, newStatus);
      if (res.data.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
        );
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleAcceptApplicant = async (jobId, applicationId, workerName) => {
    try {
      const res = await contractorApi.acceptApplicant(applicationId);
      if (res.data.success) {
        alert(`Success: ${res.data.message}`);
        fetchJobs();
      }
    } catch (err) {
      alert('Failed to accept applicant: ' + (err.response?.data?.error || err.message));
    }
  };

  const revealContact = (appId) => {
    setRevealedPhones((prev) => ({ ...prev, [appId]: true }));
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-worklog-teal border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Applicants...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Manage Posted Jobs & Applicants
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review applicant proximities, trust scores, contact directly, and link to active worksites.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <Link
            to="/contractor/post-job"
            className="px-4 py-2.5 bg-worklog-teal hover:bg-worklog-tealDark text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Another Job</span>
          </Link>
        </div>
      </div>

      {/* Sort Bar */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">
          Total Posted Vacancies: <strong>{jobs.length}</strong>
        </span>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Sort Applicants:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSortBy('distance')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                sortBy === 'distance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Nearest First
            </button>
            <button
              onClick={() => setSortBy('trust')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                sortBy === 'trust' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Highest Trust Score
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Accordion List */}
      <div className="space-y-4">
        {jobs.map((job) => {
          const isExpanded = expandedJobId === job.id;
          return (
            <div
              key={job.id}
              className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all"
            >
              {/* Job Header Bar */}
              <div
                onClick={() => toggleJobExpand(job.id)}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      job.status === 'OPEN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : job.status === 'FILLED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">• {job.siteName}</span>
                  </div>

                  <h2 className="text-lg font-black text-slate-900 leading-snug">{job.title}</h2>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-lg">
                      ₹{job.dailyWage} / day
                    </span>
                    <span>•</span>
                    <span>{job.workersNeeded} Workers Needed</span>
                    <span>•</span>
                    <span className="text-indigo-600 font-bold">
                      {job.applicantCount} Applicant{job.applicantCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                  {/* Status Dropdown */}
                  <select
                    value={job.status}
                    onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="OPEN">Status: OPEN</option>
                    <option value="FILLED">Status: FILLED</option>
                    <option value="CLOSED">Status: CLOSED</option>
                  </select>

                  <button
                    onClick={() => toggleJobExpand(job.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Applicant List */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-5 sm:p-6 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-worklog-teal" />
                      <span>Applicant Triage ({job.applicants.length})</span>
                    </h3>
                  </div>

                  {job.applicants.length === 0 ? (
                    <div className="text-center py-6 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                      No workers have applied yet for this posting. Nearby skilled workers will see it on their feed.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {job.applicants.map((app) => {
                        const isPhoneRevealed = !!revealedPhones[app.applicationId];
                        return (
                          <div
                            key={app.applicationId}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            {/* Worker Profile Info */}
                            <div className="space-y-1.5">
                              <div className="flex items-center space-x-3">
                                <div className="text-base font-bold text-slate-900">{app.worker.name}</div>
                                <TrustScoreBadge score={app.worker.trustScore} compact label="Worker Trust" />
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  app.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {app.status}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                <span className="font-semibold text-slate-800">
                                  Trades: {app.worker.trades.join(', ')}
                                </span>
                                <span>•</span>
                                <span>{app.worker.yearsExperience} yrs exp</span>
                                <span>•</span>
                                <span className="text-slate-500">{app.worker.historyCount} confirmed shifts</span>
                              </div>

                              <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                                <MapPin className="w-3.5 h-3.5 text-worklog-teal" />
                                <span>
                                  {app.distanceKm != null ? `${app.distanceKm} km from job location` : 'Nearby'}
                                </span>
                              </div>
                            </div>

                            {/* Contact & Link Actions */}
                            <div className="flex items-center space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                              {/* Contact Action */}
                              {isPhoneRevealed ? (
                                <div className="flex items-center space-x-2">
                                  <a
                                    href={`tel:${app.worker.phone}`}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center space-x-1"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-worklog-teal" />
                                    <span>{app.worker.phone}</span>
                                  </a>
                                  <a
                                    href={`https://wa.me/91${app.worker.phone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold"
                                    title="Open WhatsApp Chat"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </a>
                                </div>
                              ) : (
                                <button
                                  onClick={() => revealContact(app.applicationId)}
                                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center space-x-1.5"
                                >
                                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Reveal Contact</span>
                                </button>
                              )}

                              {/* Accept & Link Worker */}
                              {app.status === 'ACCEPTED' ? (
                                <div className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black flex items-center space-x-1">
                                  <Check className="w-4 h-4 text-emerald-600" />
                                  <span>LINKED TO SITE</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAcceptApplicant(job.id, app.applicationId, app.worker.name)}
                                  className="px-4 py-2 bg-worklog-teal hover:bg-worklog-tealDark text-white text-xs font-black rounded-xl shadow transition-all active:scale-95"
                                >
                                  ACCEPT & LINK
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
