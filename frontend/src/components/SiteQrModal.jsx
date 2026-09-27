import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, CheckCircle, Share2, Building2 } from 'lucide-react';
import { useState } from 'react';

export default function SiteQrModal({ isOpen, onClose, site }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !site) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(site.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-teal-50 text-worklog-teal rounded-2xl mx-auto flex items-center justify-center mb-3">
          <Building2 className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 leading-tight">{site.name}</h3>
        <p className="text-xs text-slate-500 capitalize mb-4">{site.siteType || 'Construction'} Site</p>

        {/* QR Code Canvas */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner mb-4">
          <QRCodeSVG
            value={site.inviteCode}
            size={180}
            level="H"
            includeMargin={true}
            bgColor="#F8FAFC"
            fgColor="#0F6E56"
          />
        </div>

        {/* Alphanumeric Code Display */}
        <div className="bg-slate-100 rounded-xl p-3 flex items-center justify-between border border-slate-200 mb-4">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Site Invite Code</span>
            <span className="font-mono text-base font-black text-slate-900 tracking-wider">{site.inviteCode}</span>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 bg-white rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all text-xs font-semibold flex items-center space-x-1"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Workers can scan this QR or type the code in their WorkLog app to directly link to this site.
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow"
        >
          Done
        </button>
      </div>
    </div>
  );
}
