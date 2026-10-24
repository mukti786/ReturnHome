import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface BrandDisclaimerProps {
  variant?: 'warning' | 'info' | 'compact';
  className?: string;
}

export const BrandDisclaimer: React.FC<BrandDisclaimerProps> = ({
  variant = 'warning',
  className = ''
}) => {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl font-medium shadow-sm ${className}`}>
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
        <span>
          <strong>Human Review Required:</strong> AI-generated matches are potential leads only and must be independently verified by authorized personnel.
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm shadow-sm ${className}`}>
      <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs sm:text-sm">
          ReturnHome Human-in-the-Loop Safeguard
        </h4>
        <p className="mt-1 text-xs text-amber-800 leading-relaxed">
          AI-generated matches are potential leads only and must be independently verified by authorized personnel. Similarity scores reflect mathematical embedding distance and do not establish confirmed identity without human sign-off.
        </p>
      </div>
    </div>
  );
};

export default BrandDisclaimer;

