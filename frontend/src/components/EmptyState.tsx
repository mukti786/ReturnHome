import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => (
  <div role="status" className={`rh-empty-state px-5 py-7 sm:px-8 sm:py-9 ${className}`}>
    <div aria-hidden="true" className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-800">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
