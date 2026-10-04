import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight, X, Upload, Image as ImageIcon, Link as LinkIcon, Sparkles } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import LogoMark from '../components/branding/LogoMark';
import { apiService } from '../services/api';

export const RegisterMissingPersonPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    height: '5 ft 8 in',
    weight: '65 kg',
    hairColor: 'Black',
    eyeColor: 'Brown',
    distinguishingFeatures: '',
    dateReported: new Date().toISOString().split('T')[0],
    lastSeenDate: new Date().toISOString().split('T')[0],
    lastSeenTime: '14:00',
    lastSeenLocation: '',
    description: '',
    clothingDescription: '',
    priority: 'High',
    contactAuthority: 'Special Missing Persons Unit, Delhi Police',
    contactNumber: '+91-11-23410000',
    caseOfficer: 'Inspector Vikram Singh'
  });

  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  ]);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [loading, setLoading] = useState(false);

  // Handle local file uploads (FileReader -> Base64 data URL)
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

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddPhotoUrl = () => {
    if (photoUrlInput.trim()) {
      setPhotos([...photos, photoUrlInput.trim()]);
      setPhotoUrlInput('');
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const sampleDemoPhotos = [
    'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'
  ];

  const handleAddSamplePhoto = (url: string) => {
    if (!photos.includes(url)) {
      setPhotos([...photos, url]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      alert('Please upload or provide at least one reference photo.');
      return;
    }
    setLoading(true);

    try {
      const res = await apiService.createCase({
        ...formData,
        age: Number(formData.age),
        gender: formData.gender as any,
        priority: formData.priority as any,
        photos
      });
      setLoading(false);
      navigate(`/cases/${res.case.caseId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to register missing person');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <LogoMark size="md" theme="light" />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Register Missing Person Profile</h1>
              <p className="text-xs text-slate-600">
                ReturnHome Case Entry System • Complete physical profile & high-quality reference photo upload.
              </p>
            </div>
          </div>

          <BrandDisclaimer variant="compact" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Personal Information */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm pb-3 border-b border-slate-100 flex items-center gap-2">
                1. Personal Demographics & Physical Description
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age at Disappearance *</label>
                  <input
                    type="number"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="12"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500 focus:bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Height</label>
                  <input
                    type="text"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="5 ft 8 in"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="65 kg"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hair Color</label>
                  <input
                    type="text"
                    value={formData.hairColor}
                    onChange={(e) => setFormData({ ...formData, hairColor: e.target.value })}
                    placeholder="Black short hair"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Eye Color</label>
                  <input
                    type="text"
                    value={formData.eyeColor}
                    onChange={(e) => setFormData({ ...formData, eyeColor: e.target.value })}
                    placeholder="Dark Brown"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Distinguishing Features & Marks</label>
                <input
                  type="text"
                  value={formData.distinguishingFeatures}
                  onChange={(e) => setFormData({ ...formData, distinguishingFeatures: e.target.value })}
                  placeholder="e.g. Small scar above left eyebrow, tattoo on right forearm"
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>
            </div>

            {/* 2. Case Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm pb-3 border-b border-slate-100 flex items-center gap-2">
                2. Case Circumstances & Last Known Location
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Reported</label>
                  <input
                    type="date"
                    required
                    value={formData.dateReported}
                    onChange={(e) => setFormData({ ...formData, dateReported: e.target.value })}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Last Seen *</label>
                  <input
                    type="date"
                    required
                    value={formData.lastSeenDate}
                    onChange={(e) => setFormData({ ...formData, lastSeenDate: e.target.value })}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Last Seen</label>
                  <input
                    type="time"
                    value={formData.lastSeenTime}
                    onChange={(e) => setFormData({ ...formData, lastSeenTime: e.target.value })}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Known Location *</label>
                <input
                  type="text"
                  required
                  value={formData.lastSeenLocation}
                  onChange={(e) => setFormData({ ...formData, lastSeenLocation: e.target.value })}
                  placeholder="e.g. New Delhi Railway Station - Platform 4 Concourse"
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Disappearance Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detail the circumstances around disappearance..."
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clothing Description</label>
                  <textarea
                    rows={3}
                    value={formData.clothingDescription}
                    onChange={(e) => setFormData({ ...formData, clothingDescription: e.target.value })}
                    placeholder="e.g. Red hooded jacket, dark denim jeans, white canvas shoes"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 3. Reference Photographs (File Upload & URL Options) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  3. Reference Photographs (Front Face, Profiles, Angles)
                </h3>

                {/* Method Switcher Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'upload'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'url'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Image URL
                  </button>
                </div>
              </div>

              {/* Method A: Local File Upload Box */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="photo-file-upload"
                  />
                  
                  <label
                    htmlFor="photo-file-upload"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/30 cursor-pointer transition-all text-center group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 group-hover:border-indigo-300 flex items-center justify-center shadow-sm mb-2">
                      <Upload className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Click to choose reference photo files from your computer
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Supports JPG, PNG, WEBP (Multiple photos allowed)
                    </span>
                  </label>

                  {/* Sample Quick Demo Photos Helper */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Demo Samples:
                    </span>
                    <div className="flex items-center gap-2">
                      {sampleDemoPhotos.map((sampleUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddSamplePhoto(sampleUrl)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-[11px] font-bold text-indigo-700 transition-all"
                        >
                          + Sample #{idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Method B: URL Input */}
              {activeTab === 'url' && (
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    placeholder="Paste high-res image URL (e.g. https://...)"
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-indigo-50 text-xs font-bold text-indigo-700 transition-colors"
                  >
                    + Add Photo URL
                  </button>
                </div>
              )}

              {/* Uploaded Photos Preview Grid */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Reference Photos Added ({photos.length}):
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                      <img src={url} alt={`Preview ${idx}`} className="w-full h-32 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        title="Remove Photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-1 left-2 text-[9px] bg-slate-900/80 text-white px-2 py-0.5 rounded font-mono font-bold">
                        {idx === 0 ? 'Front Face (Primary)' : `Ref #${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/cases')}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white font-bold text-xs shadow-lg shadow-indigo-200 flex items-center gap-2"
              >
                {loading ? 'Registering...' : 'Register Case & Extract Embeddings'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default RegisterMissingPersonPage;
