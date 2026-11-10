import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera, CameraOff, Video, AlertCircle, CheckCircle2, Shield,
  RefreshCw, MapPin, AlertTriangle, Eye, ArrowUpRight, Radio, Sliders
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import { apiService } from '../services/api';
import { CameraFeed, CandidateMatch } from '../types';

interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  similarity?: number;
  tier?: string;
}

export const LiveCameraPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Registered camera association
  const [registeredCameras, setRegisteredCameras] = useState<CameraFeed[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('CAM-04');
  const [customLocation, setCustomLocation] = useState<string>('Command Center Inspection Station');
  const [detectionThreshold, setDetectionThreshold] = useState<number>(0.65);

  // Stream state & metrics
  const [socketConnected, setSocketConnected] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'analyzing' | 'matched'>('idle');
  const [facesDetectedCount, setFacesDetectedCount] = useState<number>(0);
  const [fpsCount, setFpsCount] = useState<number>(0);
  const [liveDetections, setLiveDetections] = useState<CandidateMatch[]>([]);
  const [recentDetectionsLog, setRecentDetectionsLog] = useState<any[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const streamIntervalRef = useRef<number | null>(null);
  const frameCounterRef = useRef<number>(0);

  // Fetch registered cameras
  useEffect(() => {
    async function loadCameras() {
      try {
        const res = await apiService.getCameras();
        if (res.cameras?.length) {
          setRegisteredCameras(res.cameras);
          const cam4 = res.cameras.find(c => c.cameraId === 'CAM-04') || res.cameras[0];
          setSelectedCameraId(cam4.cameraId);
          setCustomLocation(cam4.location);
        }
      } catch {
        // Cameras optional fallback
      }
    }
    void loadCameras();
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('camera:stream_result', (data: any) => {
      setProcessingStatus('idle');
      if (data.success) {
        setFacesDetectedCount(data.facesDetected || 0);

        if (data.candidateMatches?.length > 0) {
          setProcessingStatus('matched');
          setLiveDetections(data.candidateMatches);
          setRecentDetectionsLog(prev => {
            const combined = [...data.candidateMatches, ...prev];
            // Deduplicate by matchId
            const map = new Map();
            for (const item of combined) {
              if (!map.has(item.matchId)) map.set(item.matchId, item);
            }
            return Array.from(map.values()).slice(0, 10);
          });
        }

        // Draw bounding boxes on canvas
        drawBoundingBoxes(data.candidateMatches || [], data.facesDetected || 0);
      }
    });

    // Global detection alert listener
    socket.on('detection:new', (alertData: any) => {
      setRecentDetectionsLog(prev => {
        if (prev.some(d => d.detectionId === alertData.detectionId)) return prev;
        return [alertData, ...prev].slice(0, 10);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Enumerate video devices
  const updateDeviceList = useCallback(async () => {
    try {
      const devList = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devList.filter(d => d.kind === 'videoinput');
      setDevices(videoDevs);
      if (videoDevs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch {
      // ignore
    }
  }, [selectedDeviceId]);

  // Request Camera Access and Start Stream
  const startCamera = async () => {
    setPermissionError('');
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStreaming(true);
      await updateDeviceList();

      // Begin periodic frame extraction (1 frame per 1.5 seconds)
      startFrameStreaming();
    } catch (err: any) {
      setHasPermission(false);
      setPermissionError(err.name === 'NotAllowedError'
        ? 'Camera permission was denied. Please allow camera access in your browser settings.'
        : `Could not access camera: ${err.message}`
      );
      setIsStreaming(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamIntervalRef.current) {
      window.clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    // Clear overlay canvas
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }

    setIsStreaming(false);
    setProcessingStatus('idle');
    setLiveDetections([]);
    setFacesDetectedCount(0);
  };

  // Capture frame from video element and emit via WebSocket
  const captureAndSendFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = canvasRef.current;
    canvas.width = Math.min(640, video.videoWidth);
    canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameBase64 = canvas.toDataURL('image/jpeg', 0.85);

    setProcessingStatus('analyzing');
    frameCounterRef.current += 1;

    socketRef.current.emit('camera:stream_frame', {
      frameBase64,
      cameraId: selectedCameraId,
      cameraName: registeredCameras.find(c => c.cameraId === selectedCameraId)?.name || 'Browser Live Stream',
      cameraLocation: customLocation,
      threshold: detectionThreshold
    });
  }, [selectedCameraId, customLocation, detectionThreshold, registeredCameras]);

  // Periodic frame streaming
  const startFrameStreaming = useCallback(() => {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

    // Send a frame every 1200ms
    streamIntervalRef.current = window.setInterval(() => {
      captureAndSendFrame();
    }, 1200);

    // Calculate FPS
    const fpsTimer = window.setInterval(() => {
      setFpsCount(frameCounterRef.current);
      frameCounterRef.current = 0;
    }, 1000);

    return () => {
      clearInterval(fpsTimer);
    };
  }, [captureAndSendFrame]);

  // Draw bounding boxes on the overlay canvas
  const drawBoundingBoxes = (matches: any[], faceCount: number) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (matches.length === 0) return;

    // Scale from frame resolution (e.g. 640x360) to video display size
    const scaleX = canvas.width / (canvasRef.current?.width || 640);
    const scaleY = canvas.height / (canvasRef.current?.height || 360);

    matches.forEach((match) => {
      const box = match.boundingBox;
      if (!box) return;

      const x = box.x * scaleX;
      const y = box.y * scaleY;
      const w = box.width * scaleX;
      const h = box.height * scaleY;

      // Draw detection rectangle
      ctx.lineWidth = 3;
      ctx.strokeStyle = match.confidenceTier === 'HIGH' ? '#10b981' : '#f59e0b';
      ctx.strokeRect(x, y, w, h);

      // Label background banner
      const sim = Math.round((match.similarityScore || 0) * 100);
      const labelText = `${match.missingPersonName} (${sim}%)`;
      ctx.font = 'bold 12px Inter, sans-serif';
      const textWidth = ctx.measureText(labelText).width;

      ctx.fillStyle = match.confidenceTier === 'HIGH' ? '#10b981' : '#f59e0b';
      ctx.fillRect(x, Math.max(0, y - 24), textWidth + 16, 24);

      // Label text
      ctx.fillStyle = '#0f172a';
      ctx.fillText(labelText, x + 8, Math.max(16, y - 7));
    });
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <Radio size={12} className={isStreaming ? 'animate-pulse text-emerald-600' : 'text-slate-400'} />
                  {isStreaming ? 'Live Inference Active' : 'Camera Ready'}
                </span>
                <span className="text-xs text-slate-500">
                  Socket: {socketConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Live Camera Detection Engine
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Stream camera frames into the YuNet face detector and deep neural matching pipeline in real time.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!isStreaming ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1d5147] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#163f37] transition-colors"
                >
                  <Camera size={16} /> Start Camera Stream
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
                >
                  <CameraOff size={16} /> Stop Camera Stream
                </button>
              )}
            </div>
          </header>

          <BrandDisclaimer variant="compact" />

          {permissionError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold">Camera Access Error</p>
                <p className="mt-1 text-xs leading-5 text-red-800">{permissionError}</p>
              </div>
            </div>
          )}

          {/* Configuration Controls Bar */}
          <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Camera Device
              </label>
              <select
                disabled={isStreaming}
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1d5147] focus:bg-white focus:outline-none"
              >
                {devices.length === 0 ? (
                  <option value="">Default System Webcam</option>
                ) : (
                  devices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Associate Camera ID
              </label>
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  const found = registeredCameras.find(c => c.cameraId === e.target.value);
                  if (found) setCustomLocation(found.location);
                }}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1d5147] focus:bg-white focus:outline-none"
              >
                {registeredCameras.map(c => (
                  <option key={c.cameraId} value={c.cameraId}>
                    {c.cameraId} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Station Location
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-8 pr-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1d5147] focus:bg-white focus:outline-none"
                  placeholder="e.g. Platform 4 Entrance"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Similarity Threshold
                </label>
                <span className="text-xs font-bold text-[#1d5147]">
                  {Math.round(detectionThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={detectionThreshold}
                onChange={(e) => setDetectionThreshold(parseFloat(e.target.value))}
                className="w-full accent-[#1d5147]"
              />
            </div>
          </div>

          {/* Main Streaming Display & Live Detections Feed */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Camera Viewport (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />

                {/* Overlay canvas for bounding boxes */}
                <canvas
                  ref={overlayCanvasRef}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                />

                {/* Hidden canvas for grabbing snapshot frames */}
                <canvas ref={canvasRef} className="hidden" />

                {!isStreaming && (
                  <div className="absolute inset-0 grid place-items-center bg-slate-950/90 text-slate-400">
                    <div className="text-center p-6 max-w-sm">
                      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                        <Video size={24} />
                      </div>
                      <h3 className="text-base font-semibold text-slate-200">Camera Stream Inactive</h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Click "Start Camera Stream" to initialize browser webcam ingestion.
                      </p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1d5147] px-4 py-2 text-xs font-semibold text-white hover:bg-[#163f37]"
                      >
                        <Camera size={14} /> Initialize Camera
                      </button>
                    </div>
                  </div>
                )}

                {/* HUD Overlay Stats */}
                {isStreaming && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none text-white text-xs">
                    <div className="flex items-center gap-2 rounded-lg bg-black/60 backdrop-blur-sm px-3 py-1.5 border border-white/10">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>LIVE</span>
                      <span className="text-slate-400">|</span>
                      <span>Faces: {facesDetectedCount}</span>
                      <span className="text-slate-400">|</span>
                      <span>Rate: ~1 frame / 1.2s</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-black/60 backdrop-blur-sm px-3 py-1.5 border border-white/10">
                      <span>Status:</span>
                      <span className={processingStatus === 'matched' ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {processingStatus === 'analyzing' ? 'Analyzing…' : processingStatus === 'matched' ? 'Lead Detected!' : 'Monitoring'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Note */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 flex items-start gap-3">
                <Shield size={16} className="mt-0.5 shrink-0 text-[#1d5147]" />
                <div>
                  <span className="font-semibold text-slate-800">Operational Integrity:</span> Live person detection extracts 512-dim normalized feature representations evaluated against registered missing person files. Detections exceeding {Math.round(detectionThreshold * 100)}% cosine similarity are stored as candidate sightings requiring human investigator verification before confirmation.
                </div>
              </div>
            </div>

            {/* Live Candidate Alerts Panel (1 col) */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Live Candidate Matches</h2>
                    <p className="text-[11px] text-slate-500">Real-time candidate detections on this feed</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                    {recentDetectionsLog.length} detected
                  </span>
                </div>

                <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {recentDetectionsLog.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      <Eye size={28} className="mx-auto mb-2 opacity-40" />
                      <p>No candidate leads detected yet.</p>
                      <p className="mt-1 text-[11px]">Stream active camera frames to begin scanning.</p>
                    </div>
                  ) : (
                    recentDetectionsLog.map((detection: any, idx: number) => {
                      const sim = Math.round((detection.similarityScore || 0) * 100);
                      const isHigh = detection.confidenceTier === 'HIGH';

                      return (
                        <article
                          key={detection.detectionId || detection.matchId || idx}
                          className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-all hover:border-[#1d5147]/40 hover:bg-white shadow-xs"
                        >
                          <div className="flex items-start gap-3">
                            {detection.detectedFrameUrl || detection.evidenceImageUrl ? (
                              <img
                                src={detection.detectedFrameUrl || detection.evidenceImageUrl}
                                alt="Detection snapshot"
                                className="h-14 w-14 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="grid h-14 w-14 place-items-center rounded-lg bg-slate-200 text-slate-400 shrink-0">
                                <Eye size={18} />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <h3 className="truncate text-xs font-bold text-slate-900">
                                  {detection.missingPersonName}
                                </h3>
                                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  isHigh ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {sim}% Match
                                </span>
                              </div>

                              <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                                Case: {detection.caseId || detection.caseRef}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400 flex items-center gap-1">
                                <MapPin size={10} />
                                <span className="truncate">{detection.cameraLocation || detection.location || customLocation}</span>
                              </p>

                              <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                                <span className="text-slate-400">
                                  {new Date(detection.timestamp || Date.now()).toLocaleTimeString()}
                                </span>
                                <a
                                  href={`/matches`}
                                  className="font-semibold text-[#1d5147] hover:underline flex items-center gap-0.5"
                                >
                                  Review Lead <ArrowUpRight size={10} />
                                </a>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LiveCameraPage;
