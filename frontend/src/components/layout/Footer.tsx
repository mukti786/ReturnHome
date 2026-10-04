import React from 'react';
import Logo from '../branding/Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 py-8 px-6 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand Column */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <Logo variant="full" theme="light" size="sm" showTagline={true} />
          <p className="text-[11px] text-slate-500 max-w-sm text-center md:text-left">
            An AI-assisted platform designed to help authorized investigators organize missing-person cases, analyze visual evidence, and review potential matches efficiently.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 max-w-md text-[11px] text-amber-900 text-center md:text-left shadow-sm">
          <strong className="text-amber-950 block mb-0.5 font-bold">Ethical AI & Human Review Safeguard</strong>
          AI-generated matches are potential leads only and must be independently verified by authorized personnel. AI scores do not establish confirmed identity without human sign-off.
        </div>

        {/* Links */}
        <div className="flex flex-col items-center md:items-end gap-1 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#terms" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contact Support</a>
          </div>
          <span className="mt-1 font-mono text-[10px] text-slate-400">
            ReturnHome v1.0.0 • DEMO DATA — NOT REAL PERSON INFORMATION
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
