import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Video, Clock, CheckCircle2, AlertCircle, FileText,
  MapPin, Eye, RefreshCw, ArrowUpRight, Search, Play, Shield
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import { apiService } from '../services/api';
import { VideoJob, MissingPersonCase, CameraFeed, DetectionEvent } from '../types';

export const VideoAnalysisPage: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedCaseRef, setSelectedCaseRef] = useState<string>('');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('CAM-01');
  const [cameraLocation, setCameraLocation] = useState<string>('New Delhi Railway Station - Gate 3 Concourse');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');

  // Active jobs & completed jobs
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<VideoJob | null>(null);
  const [jobDetections, setJobDetections] = useState<DetectionEvent[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Available cases & cameras
  const [availableCases, setAvailableCases] = useState<MissingPersonCase[]>([]);
  const [availableCameras, setAvailableCameras] = useState<CameraFeed[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch initial data: jobs, active cases, cameras
  const loadData = async () => {
    setIsLoadingJobs(true);
    try {
      const [jobsRes, casesRes, camerasRes] = await Promise.allSettled([
        apiService.getVideoJobs(),
        apiService.getCases({ limit: '100' }),
        apiService.getCameras()
      ]);

      if (jobsRes.status === 'fulfilled' && jobsRes.value.jobs) {
        setJobs(jobsRes.value.jobs);
        if (jobsRes.value.jobs.length > 0 && !selectedJob) {
          void loadJobDetails(jobsRes.value.jobs[0].jobId);
        }
      }

      if (casesRes.status === 'fulfilled' && casesRes.value.cases) {
        setAvailableCases(casesRes.value.cases);
      }

      if (camerasRes.status === 'fulfilled' && camerasRes.value.cameras) {
        setAvailableCameras(camerasRes.value.cameras);
        if (camerasRes.value.cameras.length > 0) {
          setSelectedCameraId(camerasRes.value.cameras[0].cameraId);
          setCameraLocation(camerasRes.value.cameras[0].location);
        }
      }
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Real-time job updates via Socket.IO
  useEffect(() => {
    const socket: Socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });

    socket.on('video:progress', (data: { jobId: string; status: string; progress: number }) => {
      setJobs(prev => prev.map(j => (j.jobId === data.jobId ? { ...j, status: data.status as any, progress: data.progress } : j)));
      if (selectedJob?.jobId === data.jobId) {
        setSelectedJob(prev => (prev ? { ...prev, status: data.status as any, progress: data.progress } : null));
      }
    });

    socket.on('video:complete', (data: { jobId: string; framesAnalyzed: number; facesDetected: number; matchesFound: number }) => {
      setJobs(prev => prev.map(j => (j.jobId === data.jobId ? {
        ...j,
        status: 'completed',
        progress: 100,
        framesAnalyzed: data.framesAnalyzed,
        facesDetected: data.facesDetected,
        candidateMatchesFound: data.matchesFound
      } : j)));

      if (selectedJob?.jobId === data.jobId) {
        void loadJobDetails(data.jobId);
      }
    });

    socket.on('video:error', (data: { jobId: string; error: string }) => {
      setJobs(prev => prev.map(j => (j.jobId === data.jobId ? { ...j, status: 'failed', error: data.error } : j)));
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedJob?.jobId]);

  // Load specific job details & detection events
  const loadJobDetails = async (jobId: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await apiService.getVideoJobById(jobId);
      if (res.job) {
        setSelectedJob(res.job);
        setJobDetections(res.detections || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = ['mp4', 'avi', 'mov', 'mkv', 'webm'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !validExtensions.includes(ext)) {
        setUploadError('Invalid format. Please select an MP4, AVI, MOV, MKV, or WebM video file.');
        return;
      }
      if (file.size > 250 * 1024 * 1024) {
        setUploadError('File size exceeds the 250MB limit.');
        return;
      }
      setVideoFile(file);
      setUploadError('');
      setUploadSuccess('');
    }
  };

  // Submit Video Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      setUploadError('Please select a video file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('video', videoFile);
    if (selectedCaseRef) formData.append('caseId', selectedCaseRef);
    formData.append('cameraId', selectedCameraId);
    formData.append('cameraName', availableCameras.find(c => c.cameraId === selectedCameraId)?.name || 'CCTV Station Feed');
    formData.append('cameraLocation', cameraLocation);

    try {
      setUploadProgress(40);
      const res = await apiService.uploadVideo(formData);
      setUploadProgress(100);
      setUploadSuccess(`Video uploaded successfully. Job ${res.jobId} created.`);
      setVideoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh jobs list
      await loadData();
      void loadJobDetails(res.jobId);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload video.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          <header className="border-b border-slate-200 pb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#356a5a]">Forensic Ingestion</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Video Analysis & Frame Ingestion</h1>
              <p className="mt-1 text-sm text-slate-600">
                Upload CCTV, bodycam, or security footage to execute asynchronous YuNet face extraction and candidate lead identification.
              </p>
            </div>
            <button
              onClick={() => void loadData()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <RefreshCw size={14} className={isLoadingJobs ? 'animate-spin' : ''} /> Refresh Jobs
            </button>
          </header>

          <BrandDisclaimer variant="compact" />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Upload & Form Section (1 col) */}
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                  <Upload size={16} className="text-[#1d5147]" />
                  Upload Investigation Footage
                </h2>

                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  {/* File Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-[#1d5147] hover:bg-slate-50/50 transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/avi,video/quicktime,video/x-matroska,video/webm"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-[#1d5147] mb-2">
                      <Video size={24} />
                    </div>
                    {videoFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-xs mx-auto">{videoFile.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{Math.round(videoFile.size / (1024 * 1024))} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Click or drag video footage here</p>
                        <p className="text-[10px] text-slate-400 mt-1">MP4, AVI, MOV, MKV up to 250MB</p>
                      </div>
                    )}
                  </div>

                  {/* Target Case selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Target Case Comparison
                    </label>
                    <select
                      value={selectedCaseRef}
                      onChange={(e) => setSelectedCaseRef(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1d5147] focus:bg-white focus:outline-none"
                    >
                      <option value="">Compare Against All Active Cases</option>
                      {availableCases.map((c) => (
                        <option key={c.caseId} value={c.caseId}>
                          {c.caseId} — {c.name} ({c.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Camera source */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Camera Source
                    </label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => {
                        setSelectedCameraId(e.target.value);
                        const cam = availableCameras.find(c => c.cameraId === e.target.value);
                        if (cam) setCameraLocation(cam.location);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1d5147] focus:bg-white focus:outline-none"
                    >
                      {availableCameras.map((cam) => (
                        <option key={cam.cameraId} value={cam.cameraId}>
                          {cam.cameraId} — {cam.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location Input */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Footage Location
                    </label>
                    <input
                      type="text"
                      value={cameraLocation}
                      onChange={(e) => setCameraLocation(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1d5147] focus:bg-white focus:outline-none"
                      placeholder="e.g. Concourse Gate 3"
                    />
                  </div>

                  {uploadProgress !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Uploading file…</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-[#1d5147] transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0 text-red-500" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                      <span>{uploadSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUploading || !videoFile}
                    className="w-full rounded-lg bg-[#1d5147] py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#163f37] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={14} /> Start Video Investigation Job
                  </button>
                </form>
              </section>

              {/* Processing Guidelines Note */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Shield size={14} className="text-[#1d5147]" /> Asynchronous Architecture
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Video processing runs asynchronously in a worker execution loop. Frames are sampled at 2 FPS, filtered through OpenCV YuNet, normalized via PyTorch ResNet, and matched against authorized case records. Results update live via Socket.IO.
                </p>
              </div>
            </div>

            {/* Jobs List & Inspection Viewport (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Previous Jobs Table / Cards */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Processing Jobs History</h2>
                    <p className="text-[11px] text-slate-500">Select a job to view extracted frames and candidate leads</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{jobs.length} jobs</span>
                </div>

                {isLoadingJobs ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading jobs…</div>
                ) : jobs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No video processing jobs found. Upload a video file to begin.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {jobs.map((job) => {
                      const isSelected = selectedJob?.jobId === job.jobId;
                      const isCompleted = job.status === 'completed';
                      const isProcessing = job.status === 'processing';
                      const isFailed = job.status === 'failed';

                      return (
                        <div
                          key={job.jobId}
                          onClick={() => void loadJobDetails(job.jobId)}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-center justify-between gap-4 ${
                            isSelected
                              ? 'border-[#1d5147] bg-[#f0f6f4]'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">{job.jobId}</span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isProcessing
                                    ? 'bg-blue-100 text-blue-800 animate-pulse'
                                    : isFailed
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {job.status.toUpperCase()}
                              </span>
                              {isProcessing && (
                                <span className="text-[10px] font-medium text-blue-700">{job.progress}%</span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-600 truncate">{job.originalFilename}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Location: {job.cameraLocation || 'Unknown'}</span>
                              <span>•</span>
                              <span>{new Date(job.createdAt).toLocaleString()}</span>
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-slate-900">
                              {job.candidateMatchesFound || 0} Leads
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {job.framesAnalyzed || 0} frames • {job.facesDetected || 0} faces
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Selected Job Detailed Inspection & Sighting Evidence */}
              {selectedJob && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Evidence Snapshots: {selectedJob.jobId}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Extracted frame offsets and bounding box candidates for human review
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {jobDetections.length} candidate leads
                    </span>
                  </div>

                  {isLoadingDetails ? (
                    <div className="py-8 text-center text-xs text-slate-400">Loading detection details…</div>
                  ) : jobDetections.length === 0 ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-8 text-center text-xs text-slate-500">
                      {selectedJob.status === 'processing'
                        ? 'Job is currently processing. Detection events will appear here once frames are scanned.'
                        : 'No candidate leads detected above similarity threshold in this video.'}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {jobDetections.map((detection) => {
                        const sim = Math.round((detection.matchingConfidence || detection.detectionConfidence || 0) * 100);
                        const isHigh = detection.confidenceTier === 'HIGH';

                        return (
                          <article
                            key={detection.detectionId}
                            className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                          >
                            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black border border-slate-200 relative">
                              {detection.evidenceImageUrl ? (
                                <img
                                  src={detection.evidenceImageUrl}
                                  alt="Evidence Snapshot"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="grid h-full place-items-center text-slate-500 text-xs">
                                  No Snapshot Available
                                </div>
                              )}
                              {detection.frameTimestamp && (
                                <span className="absolute bottom-2 left-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-white">
                                  Offset: {detection.frameTimestamp}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-900">{detection.missingPersonName}</h4>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    isHigh ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {sim}% Similarity
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">Case ID: {detection.caseRef}</p>
                              <p className="text-[10px] text-slate-400">
                                Location: {detection.cameraLocation || 'Registered Station'}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                              <span className="text-[10px] font-medium text-slate-400">
                                Status: {detection.reviewStatus}
                              </span>
                              <a
                                href="/matches"
                                className="font-semibold text-[#1d5147] hover:underline flex items-center gap-1 text-[11px]"
                              >
                                Review Lead <ArrowUpRight size={12} />
                              </a>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default VideoAnalysisPage;
