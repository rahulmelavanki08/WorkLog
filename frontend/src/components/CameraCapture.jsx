import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  VideoOff,
  Lock,
  RotateCcw
} from 'lucide-react';

export default function CameraCapture({ onCapture, disabled = false, title = "Take Live Verification Selfie" }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [flash, setFlash] = useState(false);

  // Initialize camera stream
  const startCamera = async (mode = facingMode) => {
    setPermissionDenied(false);
    setErrorMessage(null);
    setCapturedPhoto(null);

    // Stop previous stream if running
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment. Please open in Chrome, Edge, or Safari.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      setPermissionDenied(false);
    } catch (err) {
      console.warn('[CameraCapture] Camera access rejected or unavailable:', err);
      setCameraActive(false);
      setPermissionDenied(true);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was blocked or denied. Without camera access, you cannot proceed with attendance.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device found. A working camera is strictly required to verify attendance.');
      } else {
        setErrorMessage('Unable to start live camera: ' + (err.message || 'Permission denied'));
      }
      if (onCapture) {
        onCapture(null);
      }
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Flip Front/Back Camera
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Helper for accurate local Indian time
  const getFormattedLocalTime = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return `${dateStr}, ${timeStr}`;
  };

  // Capture Frame from live video
  const takeSnapshot = () => {
    if (!videoRef.current || permissionDenied) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Draw actual video frame
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);

    const formattedStamp = getFormattedLocalTime();

    // Security watermark banner
    ctx.fillStyle = 'rgba(15, 110, 86, 0.90)';
    ctx.fillRect(0, 420, 640, 60);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('WorkLog — TAMPER-PROOF ATTENDANCE', 20, 444);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#A7F3D0';
    ctx.fillText(`TIMESTAMP: ${formattedStamp}`, 20, 465);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    if (onCapture) {
      onCapture(dataUrl);
    }
  };

  // Retake
  const handleRetake = () => {
    setCapturedPhoto(null);
    if (onCapture) {
      onCapture(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-white">
      {/* Header */}
      <div className="px-4 py-3.5 bg-slate-950 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-worklog-teal" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">{title}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] font-black text-emerald-400 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE CAMERA ONLY</span>
        </div>
      </div>

      {/* Viewfinder Frame */}
      <div className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Flash effect */}
        {flash && <div className="absolute inset-0 bg-white z-40 transition-opacity duration-150"></div>}

        {/* 1. If Camera Access Denied */}
        {permissionDenied ? (
          <div className="p-6 text-center space-y-3.5 max-w-xs mx-auto animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <VideoOff className="w-7 h-7" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-black text-rose-300 uppercase tracking-wide">
                Camera Access Required
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                Without camera access, you cannot proceed with check-in or check-out. Photo-based biometric verification is mandatory for daily attendance.
              </p>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3 text-[11px] text-slate-400 text-left border border-slate-800 space-y-1">
              <div className="font-bold text-slate-200 uppercase text-[10px]">How to allow camera:</div>
              <div>1. Click the lock 🔒 / camera icon in your browser address bar.</div>
              <div>2. Set Camera permissions to <strong>Allow</strong>.</div>
              <div>3. Click the button below to retry.</div>
            </div>

            <button
              type="button"
              onClick={() => startCamera(facingMode)}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RETRY CAMERA ACCESS</span>
            </button>
          </div>
        ) : capturedPhoto ? (
          /* 2. Captured Photo Preview */
          <div className="relative w-full h-full">
            <img src={capturedPhoto} alt="Captured Selfie" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 shadow-lg">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Biometric Photo Stamped</span>
            </div>
          </div>
        ) : (
          /* 3. Live Video Stream */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            {/* Framing Guide Lines */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-60 border-2 border-dashed border-white/50 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white/80 bg-black/60 px-2.5 py-1 rounded-md">
                  Position Face Inside Oval
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info notice: NO gallery upload permitted */}
      <div className="px-4 py-2.5 bg-slate-950/90 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
        <span className="flex items-center space-x-1.5 text-amber-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Gallery upload disabled for anti-fraud integrity</span>
        </span>
        {!capturedPhoto && !permissionDenied && (
          <button
            onClick={toggleCamera}
            className="flex items-center space-x-1 text-slate-300 hover:text-white text-xs font-semibold px-2.5 py-1 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Flip</span>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-slate-950 flex items-center justify-center">
        {permissionDenied ? (
          <div className="text-xs text-rose-400 font-bold text-center py-1">
            ⚠️ Camera permission required to proceed.
          </div>
        ) : capturedPhoto ? (
          <div className="flex items-center space-x-3 w-full">
            <button
              onClick={handleRetake}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
            <div className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Photo Ready</span>
            </div>
          </div>
        ) : (
          <button
            onClick={takeSnapshot}
            disabled={disabled || !cameraActive}
            className="w-full py-3.5 px-6 rounded-2xl bg-worklog-teal hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-xl shadow-teal-950/60 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <Camera className="w-5 h-5" />
            <span>CAPTURE LIVE PHOTO</span>
          </button>
        )}
      </div>
    </div>
  );
}
