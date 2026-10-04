import React, { useState, useRef } from 'react';
import { Globe, Search, CheckCircle2, FileText, ArrowRight, ShieldCheck, Upload, Link as LinkIcon, X, Sparkles, Camera } from 'lucide-react';
import Logo from '../components/branding/Logo';
import Footer from '../components/layout/Footer';

export const PublicReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Submit Form
  const [personName, setPersonName] = useState('');
  const [age, setAge] = useState('');
  const [lastLocation, setLastLocation] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  // Reference Photo State
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoTab, setPhotoTab] = useState<'upload' | 'url'>('upload');

  // Track Form
  const [trackCode, setTrackCode] = useState('');
  const [trackedStatus, setTrackedStatus] = useState<any | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPhotos((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddPhotoUrl = () => {
    if (photoUrlInput.trim()) {
      setPhotos((prev) => [...prev, photoUrlInput.trim()]);
      setPhotoUrlInput('');
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const sampleDemoPhotos = [
    'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
  ];

  const handleAddSamplePhoto = (url: string) => {
    if (!photos.includes(url)) {
      setPhotos((prev) => [...prev, url]);
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `PUB-REF-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedCode(code);
  };

  const handleTrackReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackCode.trim()) {
      setTrackedStatus({
        code: trackCode.toUpperCase(),
        name: 'Aarav Sharma',
        status: 'RECEIVED & UNDER REVIEW',
        assignedAgency: 'Delhi Police Missing Persons Bureau',
        lastUpdated: '2026-09-07 14:00'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo variant="full" theme="dark" size="lg" showTagline={true} />
          
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Public Citizens Portal (Encrypted Submission Channel)</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold text-white">ReturnHome Public Missing Person Report Portal</h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Submit a missing person report to participating law enforcement agencies, or check your report status using your unique reference tracking code.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'submit'
                ? 'bg-gradient-to-r from-indigo-600 via-cyan-600 to-teal-500 text-white shadow-lg'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Submit New Missing Report
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'track'
                ? 'bg-gradient-to-r from-indigo-600 via-cyan-600 to-teal-500 text-white shadow-lg'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Track Case Status via Reference Code
          </button>
        </div>

        {/* Tab 1: Submit Report */}
        {activeTab === 'submit' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {submittedCode ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">Missing Person Report Received</h3>
                <p className="text-xs text-slate-300">
                  Your report has been securely transmitted to the investigating authority along with AI reference facial features. Keep this tracking reference code safe:
                </p>
                <div className="inline-block bg-slate-950 px-6 py-3 rounded-xl border border-cyan-500/50 font-mono text-xl font-bold text-cyan-400">
                  {submittedCode}
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSubmittedCode(null);
                      setPersonName('');
                      setPhotos([]);
                    }}
                    className="text-xs text-cyan-400 hover:underline font-semibold"
                  >
                    Submit Another Report
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-6">
                {/* 1. Missing Individual Information */}
                <div className="space-y-4">
                  <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800">
                    1. Missing Individual Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Full Name of Missing Person *</label>
                      <input
                        type="text"
                        required
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Approximate Age *</label>
                      <input
                        type="number"
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Age"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Last Seen Location & Circumstances *</label>
                    <input
                      type="text"
                      required
                      value={lastLocation}
                      onChange={(e) => setLastLocation(e.target.value)}
                      placeholder="e.g. Railway Station Platform 4, New Delhi"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* 2. Reference Photo for AI Matching */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <Camera className="w-4 h-4 text-cyan-400" /> 2. Upload Reference Photo (AI Face Matching)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Upload photo(s) of the missing person. ReturnHome AI engine extracts facial embeddings to search live CCTV feeds.
                      </p>
                    </div>

                    {/* Method Switcher */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setPhotoTab('upload')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                          photoTab === 'upload'
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Upload className="w-3 h-3" /> Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoTab('url')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                          photoTab === 'url'
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" /> Photo URL
                      </button>
                    </div>
                  </div>

                  {/* File Upload UI */}
                  {photoTab === 'upload' && (
                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="public-photo-file-upload"
                      />
                      
                      <label
                        htmlFor="public-photo-file-upload"
                        className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition-all text-center group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 group-hover:border-cyan-500/50 flex items-center justify-center mb-2 shadow-inner">
                          <Upload className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-xs font-bold text-slate-200">
                          Click to select reference photo file from your device
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          Upload clear front-facing photograph (JPG, PNG, WEBP)
                        </span>
                      </label>

                      {/* Quick Demo Samples */}
                      <div className="flex items-center gap-2 text-xs pt-1">
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Demo Samples:
                        </span>
                        <div className="flex items-center gap-2">
                          {sampleDemoPhotos.map((sampleUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAddSamplePhoto(sampleUrl)}
                              className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-500 text-[11px] font-bold text-cyan-400 transition-all"
                            >
                              + Sample #{idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* URL Input UI */}
                  {photoTab === 'url' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={photoUrlInput}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        placeholder="Paste image URL (e.g. https://...)"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddPhotoUrl}
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500 text-xs font-bold text-cyan-400 transition-colors"
                      >
                        + Add URL
                      </button>
                    </div>
                  )}

                  {/* Uploaded Photos Preview Grid */}
                  {photos.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-bold text-slate-300 block">
                        Uploaded AI Reference Photos ({photos.length}):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {photos.map((url, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-md">
                            <img src={url} alt={`Reference ${idx}`} className="w-full h-28 object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600/90 hover:bg-red-600 text-white shadow-md transition-colors"
                              title="Remove Photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1.5 text-[9px] bg-slate-950/90 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                              {idx === 0 ? 'Primary AI Ref' : `Ref #${idx + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Reporter Contact Details */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800">
                    3. Reporter Contact Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Reporter Name"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-teal-500 text-white font-semibold text-xs shadow-lg flex items-center justify-center gap-2 mt-4"
                >
                  Submit Official Missing Report & Process AI Photo Reference <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Track Status */}
        {activeTab === 'track' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <form onSubmit={handleTrackReport} className="flex items-center gap-3">
              <input
                type="text"
                required
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value)}
                placeholder="Enter Reference Code (e.g. PUB-REF-9021)"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-mono focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md"
              >
                Track Status
              </button>
            </form>

            {trackedStatus && (
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400 text-sm">{trackedStatus.code}</span>
                  <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded">
                    {trackedStatus.status}
                  </span>
                </div>

                <div><strong>Person Name:</strong> {trackedStatus.name}</div>
                <div><strong>Assigned Agency:</strong> {trackedStatus.assignedAgency}</div>
                <div className="text-[11px] text-slate-500">Last System Update: {trackedStatus.lastUpdated}</div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PublicReportPage;
