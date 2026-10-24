import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../branding/Logo';

export const Footer: React.FC = () => <footer className="border-t border-slate-200 bg-white px-5 py-8 text-sm text-slate-600 sm:px-8">
  <div className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
    <div className="max-w-sm"><Link to="/" aria-label="ReturnHome home"><Logo variant="full" theme="light" size="sm" showTagline={false} /></Link><p className="mt-3 text-xs leading-5">An investigator workspace for organizing missing-person cases and reviewing submitted visual evidence.</p></div>
    <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium"><Link className="hover:text-[#245c4c]" to="/privacy">Privacy</Link><Link className="hover:text-[#245c4c]" to="/terms">Terms</Link><span>Support: contact your organization administrator</span><Link className="hover:text-[#245c4c]" to="/login">Investigator login</Link></div>
  </div>
  <div className="mx-auto mt-7 max-w-7xl border-t border-slate-100 pt-5 text-[11px] leading-5 text-slate-500">Prototype notice: this repository includes demonstration records and does not establish production security, legal authority, data retention or operational readiness. Do not upload real case or biometric information until your organization has reviewed and approved the deployment.</div>
</footer>;
export default Footer;


