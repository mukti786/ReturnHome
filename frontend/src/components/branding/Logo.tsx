import React from 'react';
import LogoIcon from './LogoIcon';

export interface LogoProps {
  variant?: 'full' | 'icon' | 'monochrome';
  theme?: 'light' | 'dark' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  showTagline = false,
  className = '',
  onClick
}) => {
  const isIconOnly = variant === 'icon';

  // Text color based on theme
  let titleColor = 'text-slate-900 dark:text-white';
  let subtitleColor = 'text-slate-500 dark:text-slate-400';

  if (theme === 'light') {
    titleColor = 'text-slate-900';
    subtitleColor = 'text-slate-600';
  } else if (theme === 'dark') {
    titleColor = 'text-white';
    subtitleColor = 'text-slate-400';
  } else if (theme === 'monochrome') {
    titleColor = 'text-slate-950';
    subtitleColor = 'text-slate-600';
  }

  // Size styling
  let textSize = 'text-xl font-bold tracking-tight';
  let taglineSize = 'text-xs font-medium';
  if (size === 'sm') {
    textSize = 'text-base font-bold';
    taglineSize = 'text-[10px]';
  } else if (size === 'lg') {
    textSize = 'text-2xl font-extrabold';
    taglineSize = 'text-sm font-medium';
  } else if (size === 'xl') {
    textSize = 'text-3xl font-extrabold';
    taglineSize = 'text-base font-medium';
  }

  return (
    <div 
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <LogoIcon size={size} theme={theme} />

      {!isIconOnly && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`${textSize} ${titleColor}`}>
              Return<span className="text-cyan-500 dark:text-cyan-400">Home</span>
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-cyan-500/10 text-cyan-500 dark:bg-cyan-400/10 dark:text-cyan-400 border border-cyan-500/20">
              AI
            </span>
          </div>

          {showTagline && (
            <span className={`${taglineSize} ${subtitleColor} mt-0.5 font-sans tracking-wide`}>
              From Missing to Found.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;

