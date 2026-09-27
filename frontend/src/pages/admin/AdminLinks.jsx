import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import TrustScoreBadge from '../../components/TrustScoreBadge';
import {
  Users,
  ShieldCheck,
  Building,
  HardHat,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Lock
} from 'lucide-react';

export default function AdminLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  const fetchLinks = async () => {
    try {
      const res = await adminApi.getLinks();
      if (res.data.success) {
        setLinks(res.data.links);
      }
    } catch (err) {
      console.error('Failed to load links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleRevoke = async (link) => {
    const reason = window.prompt(
      `Revoke active employment link between "${link.worker.name}" and "${link.contractor.name}"?\n\n(Historical attendance and wage records will remain 100% preserved. Future shifts will be blocked under this link.)\n\nEnter reason for revocation:`,
      'Administrative intervention / Coercion risk prevention'
    );

    if (reason === null) return; // User cancelled prompt

    setRevokingId(link.id);
    try {
      const res = await adminApi.revokeLink({
        linkId: link.id,
        reason,
      });

      if (res.data.success) {
        alert(res.data.message);
        fetchLinks();
      }
    } catch (err) {
      alert('Failed to revoke link: ' + (err.response?.data?.error || err.message));
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {links.length} Platform Linkages
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Direct Onboarding & Coercion Safeguard</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Worker-Contractor Platform Links
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin directory of all linked pairings. Revoking halts future check-ins while preserving 100% of historical wage evidence.
          </p>
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <Users className="w-4 h-4 text-worklog-teal" />
            <span>Active & Revoked Worker-Contractor Ties</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Worker Party</th>
                <th className="px-5 py-3">Contractor Party</th>
                <th className="px-5 py-3">Assigned Worksite</th>
                <th className="px-5 py-3">Established Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Oversight Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Loading links...
                  </td>
                </tr>
              ) : links.length > 0 ? (
                links.map((link) => {
                  const isActive = link.status === 'ACTIVE';
                  const isRevoked = link.status === 'REVOKED';
                  const isPending = link.status === 'PENDING';

                  return (
                    <tr key={link.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Worker */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 flex items-center space-x-2">
                          <span>{link.worker?.name}</span>
                          <TrustScoreBadge score={link.worker?.trustScore || 100} compact label="Trust" />
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{link.worker?.phone}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {link.worker?.trades?.join(', ') || 'Worker'}
                        </div>
                      </td>

                      {/* Contractor */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 flex items-center space-x-2">
                          <span>{link.contractor?.name}</span>
                          <TrustScoreBadge score={link.contractor?.trustScore || 100} compact label="Trust" />
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{link.contractor?.phone}</div>
                      </td>

                      {/* Worksite */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{link.site?.name || 'General Project'}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{link.site?.siteType || 'Construction'}</div>
                      </td>

                      {/* Established */}
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(link.createdAt).toLocaleDateString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRevoked
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {link.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isActive ? (
                          <button
                            onClick={() => handleRevoke(link)}
                            disabled={revokingId === link.id}
                            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 shadow-sm transition-all"
                          >
                            {revokingId === link.id ? 'Revoking...' : 'REVOKE LINK'}
                          </button>
                        ) : isRevoked ? (
                          <span className="text-[11px] font-bold text-slate-400">
                            Revoked (Records Intact)
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-bold">
                            Pending 1st Check-In
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No links found across the platform.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
