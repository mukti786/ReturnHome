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
  theme = 'light',
  size = 'md',
  showTagline = false,
  className = '',
  onClick
}) => {
  const isIconOnly = variant === 'icon';

  // Text color based on theme
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const accentColor = theme === 'dark' ? 'text-teal-400' : 'text-teal-800';
  const taglineColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  let textSize = 'text-xl font-bold tracking-tight';
  let taglineSize = 'text-xs font-medium';
  if (size === 'sm') {
    textSize = 'text-base font-bold';
    taglineSize = 'text-[10px]';
  } else if (size === 'lg') {
    textSize = 'text-2xl font-bold';
    taglineSize = 'text-xs font-medium';
  } else if (size === 'xl') {
    textSize = 'text-3xl font-extrabold';
    taglineSize = 'text-sm font-medium';
  }

  return (
    <div 
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <LogoIcon size={size} theme={theme} />

      {!isIconOnly && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`${textSize} ${textColor} font-semibold tracking-tight`}>
              Return<span className={accentColor}>Home</span>
            </span>
          </div>

          {showTagline && (
            <span className={`${taglineSize} ${taglineColor} tracking-normal`}>
              Missing Person Investigation Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
