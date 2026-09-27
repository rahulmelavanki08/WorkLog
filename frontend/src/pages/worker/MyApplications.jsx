import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workerApi } from '../../services/api';
import TrustScoreBadge from '../../components/TrustScoreBadge';
import { Layers, Clock, CheckCircle2, XCircle, PhoneCall, Building, MapPin, ArrowLeft } from 'lucide-react';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApps() {
      try {
        const res = await workerApi.getMyApplications();
        if (res.data.success) {
          setApplications(res.data.applications);
        }
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Accepted & Linked</span>
          </span>
        );
      case 'CONTACTED':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-black rounded-full uppercase">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Contractor Contacted</span>
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-full uppercase">
            <XCircle className="w-3.5 h-3.5" />
            <span>Declined</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>Under Review (Pending)</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/worker/find-work"
            className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Job Feed</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Job Applications ({applications.length})
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-worklog-teal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs font-bold text-slate-500">Loading your applications...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Job Applications Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse open contractor job postings and apply with one tap to start logging verified shifts.
          </p>
          <Link
            to="/worker/find-work"
            className="inline-flex items-center px-4 py-2.5 bg-worklog-teal text-white text-xs font-bold rounded-xl shadow"
          >
            Find Open Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusBadge(app.status)}
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Applied on {new Date(app.appliedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">{app.job.title}</h3>
                  <div className="text-xs text-slate-600 flex items-center space-x-2 mt-0.5">
                    <span>Contractor: <strong>{app.job.contractor.name}</strong></span>
                    {app.job.contractor.phone && (
                      <>
                        <span>•</span>
                        <span className="text-slate-500">{app.job.contractor.phone}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-slate-600 font-semibold pt-1">
                  <span className="bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-lg">
                    ₹{app.job.dailyWage} / day
                  </span>
                  {app.distanceKm != null && (
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-lg flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-worklog-teal" />
                      <span>{app.distanceKm} km away</span>
                    </span>
                  )}
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-lg capitalize">
                    {app.job.durationType?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <TrustScoreBadge score={app.job.contractor.trustScore} compact label="Contractor Trust" />
                {app.status === 'ACCEPTED' && (
                  <Link
                    to="/worker/checkin"
                    className="px-3.5 py-2 bg-worklog-teal hover:bg-worklog-tealDark text-white text-xs font-bold rounded-xl shadow"
                  >
                    Check-in on Site
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
