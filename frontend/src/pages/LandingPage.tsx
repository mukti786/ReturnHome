import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  Video, 
  GitCompare, 
  MapPin, 
  FileText, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  UserCheck,
  Cpu,
  Globe,
  Sparkles,
  Shield,
  Eye
} from 'lucide-react';
import Logo from '../components/branding/Logo';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import Footer from '../components/layout/Footer';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo variant="full" theme="light" size="lg" showTagline={true} />
          
          <div className="flex items-center gap-4">
            <Link
              to="/public-report"
              className="text-xs text-slate-600 hover:text-indigo-600 font-semibold transition-colors hidden sm:flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4 text-cyan-600" /> Public Report Portal
            </Link>
            <Link
              to="/login"
              className="text-xs text-slate-700 hover:text-indigo-600 font-semibold px-3.5 py-2 rounded-xl border border-slate-300 hover:border-indigo-400 bg-white shadow-sm transition-all"
            >
              Investigator Login
            </Link>
            <Link
              to="/dashboard"
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:scale-[1.02] transition-all flex items-center gap-1.5"
            >
              Launch Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 overflow-hidden bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-50 border-b border-slate-200/80">
        {/* Soft Vibrant Mesh Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-cyan-200/40 via-blue-200/30 to-indigo-200/40 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[300px] bg-amber-200/25 blur-[90px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>AI-Assisted Missing Person Investigation Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900">
              Khoj<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-600">Setu</span>
            </h1>

            <p className="text-xl sm:text-2xl font-extrabold text-cyan-700 tracking-wide font-sans">
              “From Missing to Found.”
            </p>

            <p className="text-base sm:text-lg text-slate-700 max-w-2xl leading-relaxed font-normal">
              An AI-assisted platform designed to help authorized investigators organize missing-person cases, analyze visual evidence, and review potential matches efficiently — keeping a human investigator in complete control of every decision.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white font-bold text-sm shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-indigo-400 text-slate-800 font-bold text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-cyan-600" /> Investigator Login
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold text-sm hover:bg-cyan-100/70 transition-all"
              >
                Explore Live Demo Data
              </button>
            </div>

            {/* Ethical Banner in Hero */}
            <div className="pt-2">
              <BrandDisclaimer variant="warning" />
            </div>
          </div>

          {/* Hero Visual Mockup - Bright Modern Console */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-indigo-100 p-5 space-y-4 relative overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-mono text-[11px] font-semibold text-slate-700">ReturnHome Inspector Console</span>
                </div>
                <span className="bg-cyan-100 text-cyan-800 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold border border-cyan-200">
                  LIVE STREAM FEED
                </span>
              </div>

              {/* Mock Match Preview Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900">Potential Lead #MATCH-2026-001</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-lg">
                    91% Similarity
                  </span>
                </div>

                {/* Side-by-side Mock */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-2 border border-slate-200 text-center shadow-sm">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">Missing Reference</span>
                    <img
                      src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=400&q=80"
                      alt="Reference"
                      className="w-full h-28 object-cover rounded-md border border-slate-300"
                    />
                    <span className="text-[11px] font-bold text-slate-800 block mt-1.5">Aarav Sharma</span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-cyan-300 text-center shadow-sm relative">
                    <span className="text-[10px] text-cyan-700 font-bold block mb-1">CCTV Frame CAM-01</span>
                    <img
                      src="https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=400&q=80"
                      alt="CCTV Frame"
                      className="w-full h-28 object-cover rounded-md border border-cyan-400"
                    />
                    <span className="text-[11px] font-bold text-cyan-700 block mt-1.5 font-mono">TRACK-00021</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Pending Human Sign-Off
                  </span>
                  <button
                    onClick={() => navigate('/matches')}
                    className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    Review Match
                  </button>
                </div>
              </div>

              {/* Status pills */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block font-medium">Total Cases</span>
                  <strong className="text-slate-900 text-sm font-black">34 Active</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block font-medium">Frames Ingested</span>
                  <strong className="text-cyan-700 text-sm font-black">7,240/sec</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block font-medium">Human Verified</span>
                  <strong className="text-emerald-700 text-sm font-black">100%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">How ReturnHome Works</h2>
            <p className="text-sm text-slate-600">
              A structured 5-step workflow ensuring high-precision candidate lead generation with strict human oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Register Case', desc: 'Case officer enters missing person profile & photo set.', icon: UserCheck },
              { step: '2', title: 'Upload Evidence', desc: 'Ingest CCTV footage, video feeds, or photos.', icon: Video },
              { step: '3', title: 'AI Analysis', desc: 'Face detection, quality check & vector embedding.', icon: Cpu },
              { step: '4', title: 'Potential Match', desc: 'Top-K candidate leads surfaced with similarity %.', icon: GitCompare },
              { step: '5', title: 'Human Sign-off', desc: 'Investigator verifies evidence before case status updates.', icon: ShieldCheck }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 relative group hover:border-indigo-400 hover:shadow-md transition-all">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center font-mono font-bold text-sm">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Icon className="w-4 h-4 text-cyan-600" /> {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">Core Platform Capabilities</h2>
          <p className="text-sm text-slate-600">
            Engineered specifically for missing-person investigative teams, law enforcement, and recognized search organizations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Missing Person Case Management',
              desc: 'Digital repository for case registration, physical attributes, multiple reference photo sets, and priority flags.',
              icon: Search
            },
            {
              title: 'AI Face Embedding Search',
              desc: 'High-speed vector similarity engine ranking candidate leads by embedding cosine distance.',
              icon: Cpu
            },
            {
              title: 'CCTV Video Stream Analysis',
              desc: 'Frame extraction, face detection quality scoring (blur, lighting, pose angle), and deduplicated track generation.',
              icon: Video
            },
            {
              title: 'Side-by-Side Match Inspector',
              desc: 'Human-in-the-loop verification workspace displaying reference photo vs CCTV detection overlay.',
              icon: GitCompare
            },
            {
              title: 'Journey Reconstruction',
              desc: 'Interactive map plotting camera sighting checkpoints in chronological sequence for confirmed leads.',
              icon: MapPin
            },
            {
              title: 'Immutable Audit Logging',
              desc: 'Cryptographic trail recording every search, view, and verification decision for complete accountability.',
              icon: Lock
            }
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{f.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
