import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Eye, MapPin, Camera, Clock, User, Phone, Mail,
  CheckCircle, AlertCircle, ArrowLeft, Navigation
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { apiService } from '../services/api';
import { MissingPersonCase } from '../types';
import { useAuth } from '../context/AuthContext';

export const SubmitSightingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const caseRefParam = searchParams.get('caseRef') || '';

  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [selectedCaseRef, setSelectedCaseRef] = useState(caseRefParam);
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationSource, setLocationSource] = useState<'citizen_gps' | 'manual_entry'>('manual_entry');
  const [dateTimeSeen, setDateTimeSeen] = useState(new Date().toISOString().slice(0, 16));
  const [clothingSeen, setClothingSeen] = useState('');
  const [notes, setNotes] = useState('');

  // Reporter info
  const [reporterName, setReporterName] = useState(user?.name || '');
  const [reporterPhone, setReporterPhone] = useState(user?.phone || '');
  const [reporterEmail, setReporterEmail] = useState(user?.email || '');

  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>('');

  // States
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<any>(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await apiService.getCases({ limit: '50' });
        if (res.success) {
          setCases(res.cases);
          if (!selectedCaseRef && res.cases.length > 0) {
            setSelectedCaseRef(res.cases[0].caseId);
          }
        }
      } catch { /* ignore */ }
    };
    void fetchCases();
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationSource('citizen_gps');
        setDetectingGps(false);
        if (!location) {
          setLocation(`GPS Coordinates (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)})`);
        }
      },
      (err) => {
        setDetectingGps(false);
        setGpsError(`Could not access GPS location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/i)) {
      setError('Please upload a valid image (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('The photo must be 15 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseRef) {
      setError('Please select the missing person case this sighting pertains to.');
      return;
    }
    if (!location.trim()) {
      setError('Please describe or detect the location of the sighting.');
      return;
    }
    if (!notes.trim()) {
      setError('Please provide observation notes describing what you saw.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await apiService.createSighting({
        caseRef: selectedCaseRef,
        location: location.trim(),
        latitude,
        longitude,
        locationSource,
        dateTimeSeen: new Date(dateTimeSeen).toISOString(),
        clothingSeen: clothingSeen.trim() || undefined,
        notes: notes.trim(),
        reporterName: reporterName.trim() || user?.name || 'Citizen',
        reporterPhone: reporterPhone.trim() || undefined,
        reporterEmail: reporterEmail.trim() || undefined,
        photoBase64: photoBase64 || undefined
      });

      if (res.success) {
        setSuccessResult(res.sighting);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit sighting.');
    } finally {
      setSubmitting(false);
    }
  };

  const targetCase = cases.find(c => c.caseId === selectedCaseRef);

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Navigation back */}
        <div className="flex items-center gap-2">
          <Link
            to={selectedCaseRef ? `/cases/${selectedCaseRef}` : '/cases'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={14} /> Back to {selectedCaseRef || 'Cases'}
          </Link>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#356a5a]">
            <Eye size={14} /> Citizen Sighting Intake Portal
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Report a Potential Sighting
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Submit critical real-world observations directly to verified case investigators. All leads are audited and reviewed.
          </p>
        </div>

        {successResult ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 text-center space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg">
              <CheckCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Sighting Successfully Submitted</h3>
              <p className="mt-1 text-sm text-slate-600">
                Reference ID: <strong className="font-mono text-emerald-800">{successResult.sightingId}</strong>
              </p>
              <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto">
                Assigned investigators have received an automated alert. Your submission has been securely preserved in the case activity timeline.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <Link
                to={`/cases/${selectedCaseRef}`}
                className="rounded-xl bg-[#356a5a] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#2b5548]"
              >
                View Case Dossier
              </Link>
              <Link
                to="/dashboard"
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Case Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Target Missing-Person Case *
              </label>
              <select
                value={selectedCaseRef}
                onChange={(e) => setSelectedCaseRef(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#356a5a] focus:outline-none"
              >
                <option value="">Select a registered case...</option>
                {cases.map((c) => (
                  <option key={c.caseId} value={c.caseId}>
                    {c.name} ({c.caseId}) — Last seen {c.lastSeenLocation}
                  </option>
                ))}
              </select>

              {targetCase && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-100">
                  {targetCase.photos?.[0] ? (
                    <img
                      src={targetCase.photos[0]}
                      alt={targetCase.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-200 text-xs font-bold text-slate-500">
                      {targetCase.name.charAt(0)}
                    </div>
                  )}
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">{targetCase.name}</p>
                    <p className="text-slate-500">Age: {targetCase.age} · Last seen: {targetCase.lastSeenLocation}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Location Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sighting Location *
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={detectingGps}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[#356a5a] hover:bg-teal-100 transition-colors disabled:opacity-60"
                >
                  <Navigation size={12} className={detectingGps ? 'animate-spin' : ''} />
                  {detectingGps ? 'Querying GPS…' : 'Capture Current GPS'}
                </button>
              </div>

              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Connaught Place Inner Circle, near Metro Gate 4, New Delhi"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#356a5a] focus:outline-none"
                />
              </div>

              {latitude !== undefined && longitude !== undefined && (
                <div className="flex items-center gap-2 text-[11px] text-teal-800 bg-teal-50/80 p-2 rounded-lg border border-teal-200 font-mono">
                  <span className="font-bold">GPS Verified:</span> Lat {latitude.toFixed(5)}, Lng {longitude.toFixed(5)} ({locationSource})
                </div>
              )}

              {gpsError && (
                <p className="text-xs text-rose-600">{gpsError}</p>
              )}
            </div>

            {/* Date & Time Seen */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Date & Time of Sighting *
                </label>
                <div className="relative mt-1.5">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={dateTimeSeen}
                    onChange={(e) => setDateTimeSeen(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-[#356a5a] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Clothing / Appearance Observed
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blue denim jacket, dark sneakers, baseball cap"
                  value={clothingSeen}
                  onChange={(e) => setClothingSeen(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#356a5a] focus:outline-none"
                />
              </div>
            </div>

            {/* Observations & Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Detailed Observation Notes *
              </label>
              <textarea
                rows={4}
                placeholder="Describe exactly what happened: direction of travel, physical condition, who they were with, demeanor, or any other critical context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#356a5a] focus:outline-none leading-relaxed"
              />
            </div>

            {/* Photograph Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Photograph Evidence (Optional but strongly recommended)
              </label>
              <div className="mt-2 flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-dashed border-slate-300 p-4">
                {photoPreview ? (
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                    <img src={photoPreview} alt="Sighting preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhotoPreview(null); setPhotoBase64(''); }}
                      className="absolute top-1 right-1 rounded-full bg-slate-900/80 p-1 text-white hover:bg-rose-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                    <Camera size={28} />
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                    <span>{photoPreview ? 'Change Photograph' : 'Choose Photo File'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Accepts JPEG, PNG, or WebP up to 15 MB. Preserved in encrypted storage.
                  </p>
                </div>
              </div>
            </div>

            {/* Reporter Contact Information */}
            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Your Contact Information (Confidential)
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600">Your Full Name</label>
                  <div className="relative mt-1">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-[#356a5a] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600">Phone Number</label>
                  <div className="relative mt-1">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-[#356a5a] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600">Email Address</label>
                  <div className="relative mt-1">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-[#356a5a] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#356a5a] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#2b5548] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#356a5a] disabled:opacity-60"
              >
                <Eye size={15} />
                {submitting ? 'Submitting Sighting…' : 'Submit Sighting for Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default SubmitSightingPage;
