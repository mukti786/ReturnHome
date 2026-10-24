import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Scale } from 'lucide-react';
import Footer from '../components/layout/Footer';
import Logo from '../components/branding/Logo';

const content = {
  privacy: {
    icon: ShieldCheck, title: 'Privacy and data handling',
    intro: 'This repository is a software prototype, not a published privacy commitment for an operational service.',
    sections: [
      ['Demonstration data', 'The project contains seeded example records and sample imagery. Treat all records as demonstration content. Do not submit real missing-person, face, video, contact or investigation data to an unreviewed deployment.'],
      ['Deployment responsibility', 'Before real use, the deploying organization must document its lawful authority, purpose, access controls, data retention and deletion process, incident response, vendor arrangements, and applicable privacy requirements. Those controls are not established by this prototype.'],
      ['Contact', 'For questions about an organization’s deployment or records, contact the administrator responsible for that deployment.']
    ]
  },
  terms: {
    icon: Scale, title: 'Terms of use',
    intro: 'ReturnHome is provided here as a prototype for evaluation. This page is not legal advice or an operational authorization.',
    sections: [
      ['Authorized use', 'Use any deployment only with your organization’s permission and under its documented procedures and applicable law.'],
      ['Automated results', 'Visual analysis and similarity results are uncertain candidate leads. They must not be treated as proof of identity or used as the sole basis for an adverse or consequential decision.'],
      ['Evaluation status', 'The repository does not establish production service levels, security certification, legal compliance, data ownership terms, or an organization’s authorization to process real case data.']
    ]
  }
};

const InfoPage: React.FC<{ kind: keyof typeof content }> = ({ kind }) => {
  const page = content[kind];
  const Icon = page.icon;
  return <div className="min-h-screen bg-[#f8f8f5] text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4"><Link to="/"><Logo variant="full" theme="light" size="md" showTagline={false} /></Link><Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"><ArrowLeft size={16} /> Home</Link></div></header><main className="mx-auto max-w-4xl px-5 py-14 sm:py-20"><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#edf2ed] text-[#356a5a]"><Icon size={24} /></div><h1 className="mt-6 text-4xl font-semibold tracking-tight">{page.title}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{page.intro}</p><div className="mt-10 space-y-8">{page.sections.map(([title, body]) => <section key={title} className="border-t border-slate-200 pt-6"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{body}</p></section>)}</div><Link to="/login" className="mt-10 inline-flex items-center rounded-lg bg-[#1d5147] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163f37]">Investigator sign in</Link></main><Footer /></div>;
};
export default InfoPage;


