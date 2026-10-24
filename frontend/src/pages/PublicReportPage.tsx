import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleAlert, ShieldAlert, UploadCloud } from 'lucide-react';
import Logo from '../components/branding/Logo';
import Footer from '../components/layout/Footer';
import LocationPicker from '../components/LocationPicker';
import { apiService } from '../services/api';

const blank = {
  fullName: '', age: '', dateOfBirth: '', gender: '', physicalDescription: '', identifyingMarks: '', clothing: '', additionalInformation: '',
  lastSeenDate: '', lastSeenTime: '', lastSeenAddress: '', city: '', state: '', country: '', latitude: '', longitude: '', circumstances: '',
  reporterName: '', reporterPhone: '', reporterEmail: '', relationship: '', preferredContact: ''
};

const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20';
const labelClass = 'block text-sm font-medium text-slate-200';

const PublicReportPage: React.FC = () => {
  const [form, setForm] = useState(blank);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!photo) { setPreview(''); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const update = (key: keyof typeof blank) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const handlePhoto = (file?: File) => {
    setPhotoError('');
    if (!file) { setPhoto(null); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhoto(null); setPhotoError('Choose a JPEG, PNG, or WebP image.'); return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhoto(null); setPhotoError('Photo must be 8 MB or smaller.'); return;
    }
    setPhoto(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setResult('');
    if (!form.reporterPhone.trim() && !form.reporterEmail.trim()) {
      setError('Provide a phone number or email address so the review team can contact you.'); return;
    }
    if ((form.preferredContact === 'Phone' && !form.reporterPhone.trim()) || (form.preferredContact === 'Email' && !form.reporterEmail.trim())) {
      setError('Add the contact detail that matches your preferred contact method.'); return;
    }
    setSubmitting(true);
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (photo) data.append('photo', photo);
    try {
      const response = await apiService.createPublicReport(data);
      setResult(`${response.message} Reference: ${response.report.referenceId}.`);
      setForm(blank); setPhoto(null);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The report could not be submitted. Your details remain in this form.');
    } finally { setSubmitting(false); }
  };

  return <div className="min-h-screen bg-[#07111a] text-slate-100">
    <header className="border-b border-slate-800 bg-[#07111a]/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" aria-label="ReturnHome home"><Logo variant="full" theme="light" size="md" showTagline={false} /></Link>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"><ArrowLeft size={16} /> Home</Link>
      </div>
    </header>

    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-300">Public report intake</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Share what you know.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">Send the details to this ReturnHome deployment for investigator review. This form does not file an official report or notify emergency services.</p>
      </div>

      <div className="mt-7 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100" role="note">
        <CircleAlert size={19} className="mt-0.5 shrink-0 text-amber-300" />
        <p><strong className="font-semibold">Immediate danger?</strong> Contact your local emergency services now. ReturnHome is not monitored and cannot dispatch help.</p>
      </div>

      {error && <div role="alert" className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm leading-6 text-rose-200">{error}</div>}
      {result && <div role="status" className="mt-5 flex gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100"><CheckCircle2 size={19} className="mt-0.5 shrink-0" /><p>{result}</p></div>}

      <form onSubmit={handleSubmit} className="mt-7 space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 sm:p-7">
          <h2 className="text-lg font-semibold">About the missing person</h2>
          <p className="mt-1 text-sm text-slate-400">Share what you know; unknown details can be left blank.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Full name <span className="text-rose-300">*</span><input className={inputClass} name="fullName" autoComplete="off" required maxLength={160} value={form.fullName} onChange={update('fullName')} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>Age<input className={inputClass} type="number" min="0" max="130" value={form.age} onChange={update('age')} /></label>
              <label className={labelClass}>Date of birth<input className={inputClass} type="date" value={form.dateOfBirth} onChange={update('dateOfBirth')} /></label>
            </div>
            <label className={labelClass}>Gender, if relevant<input className={inputClass} maxLength={80} value={form.gender} onChange={update('gender')} /></label>
            <label className={labelClass}>Physical description<input className={inputClass} maxLength={3000} value={form.physicalDescription} onChange={update('physicalDescription')} placeholder="Height, build, hair, eyes…" /></label>
            <label className={labelClass}>Identifying marks<textarea className={`${inputClass} min-h-20`} maxLength={2000} value={form.identifyingMarks} onChange={update('identifyingMarks')} /></label>
            <label className={labelClass}>Clothing last seen in<textarea className={`${inputClass} min-h-20`} maxLength={2000} value={form.clothing} onChange={update('clothing')} /></label>
            <label className={`${labelClass} sm:col-span-2`}>Additional information<textarea className={`${inputClass} min-h-24`} maxLength={4000} value={form.additionalInformation} onChange={update('additionalInformation')} /></label>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-4">
            <label className={labelClass} htmlFor="report-photo">Recent photograph <span className="text-slate-500">(optional)</span></label>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
              <label htmlFor="report-photo" className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:border-teal-400 hover:text-white"><UploadCloud size={17} /> Choose photo</label>
              <input id="report-photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { handlePhoto(event.target.files?.[0]); event.currentTarget.value = ''; }} />
              <span className="text-xs text-slate-500">JPEG, PNG or WebP · max 8 MB. Stored privately for signed-in investigators.</span>
              {preview && <img src={preview} alt="Selected photo preview" className="h-20 w-20 rounded-lg border border-slate-700 object-cover" />}
            </div>
            {photo && <button type="button" onClick={() => handlePhoto()} className="mt-2 text-xs text-slate-400 underline hover:text-white">Remove {photo.name}</button>}
            {photoError && <p role="alert" className="mt-2 text-sm text-rose-300">{photoError}</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Last known location</h2>
          <p className="mt-1 text-sm text-slate-400">Enter the place as you know it. Coordinates are optional and never guessed.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>Address or place <span className="text-rose-300">*</span><input className={inputClass} required maxLength={500} value={form.lastSeenAddress} onChange={update('lastSeenAddress')} placeholder="Street, landmark, station…" /></label>
            <label className={labelClass}>City<input className={inputClass} maxLength={120} value={form.city} onChange={update('city')} /></label>
            <label className={labelClass}>State / region<input className={inputClass} maxLength={120} value={form.state} onChange={update('state')} /></label>
            <label className={labelClass}>Country<input className={inputClass} maxLength={120} value={form.country} onChange={update('country')} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>Last seen date<input className={inputClass} type="date" value={form.lastSeenDate} onChange={update('lastSeenDate')} /></label>
              <label className={labelClass}>Time<input className={inputClass} type="time" value={form.lastSeenTime} onChange={update('lastSeenTime')} /></label>
            </div>
          </div>
          <div className="mt-5"><LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))} /></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Latitude<input className={inputClass} inputMode="decimal" value={form.latitude} onChange={update('latitude')} placeholder="Optional" /></label>
            <label className={labelClass}>Longitude<input className={inputClass} inputMode="decimal" value={form.longitude} onChange={update('longitude')} placeholder="Optional" /></label>
            <label className={`${labelClass} sm:col-span-2`}>Circumstances<textarea className={`${inputClass} min-h-24`} maxLength={4000} value={form.circumstances} onChange={update('circumstances')} /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5 sm:p-7">
          <h2 className="text-lg font-semibold">How we can contact you</h2>
          <p className="mt-1 text-sm text-slate-400">Your contact details are only available in the protected investigator workspace.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Your name <span className="text-rose-300">*</span><input className={inputClass} required maxLength={160} autoComplete="name" value={form.reporterName} onChange={update('reporterName')} /></label>
            <label className={labelClass}>Relationship<input className={inputClass} maxLength={120} value={form.relationship} onChange={update('relationship')} placeholder="Family, friend, witness…" /></label>
            <label className={labelClass}>Phone<input className={inputClass} type="tel" autoComplete="tel" maxLength={40} value={form.reporterPhone} onChange={update('reporterPhone')} /></label>
            <label className={labelClass}>Email<input className={inputClass} type="email" autoComplete="email" maxLength={254} value={form.reporterEmail} onChange={update('reporterEmail')} /></label>
            <label className={labelClass}>Preferred contact method<select className={inputClass} value={form.preferredContact} onChange={update('preferredContact')}><option value="">No preference</option><option value="Phone">Phone</option><option value="Email">Email</option></select></label>
            <p className="self-end text-xs leading-5 text-slate-500">At least one phone number or email address is required.</p>
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs leading-5 text-slate-400"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-teal-300" /><p>Submitting shares this information with authorized users of this ReturnHome deployment. It is not automatically sent to police, emergency services, or any other agency.</p></div>
        <button type="submit" disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-200 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:min-w-56">{submitting ? 'Saving report…' : 'Submit report'}</button>
      </form>
    </main>
    <Footer />
  </div>;
};

export default PublicReportPage;
