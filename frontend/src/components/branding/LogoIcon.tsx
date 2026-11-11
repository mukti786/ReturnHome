import React from 'react';

interface LogoIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  theme?: 'light' | 'dark' | 'monochrome';
}

export const LogoIcon: React.FC<LogoIconProps> = ({ 
  size = 'md', 
  className = '',
  theme = 'light'
}) => {
  let dimension = 32;
  if (typeof size === 'number') {
    dimension = size;
  } else if (size === 'sm') {
    dimension = 22;
  } else if (size === 'md') {
    dimension = 32;
  } else if (size === 'lg') {
    dimension = 44;
  } else if (size === 'xl') {
    dimension = 56;
  }

  const primaryColor = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const accentColor = theme === 'dark' ? '#38bdf8' : '#0f766e';

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="ReturnHome Emblem"
    >
      {/* Outer shield frame */}
      <rect x="2" y="2" width="36" height="36" rx="8" fill={theme === 'dark' ? '#1e293b' : '#0f172a'} />
      {/* Location pin & homecoming path */}
      <path
        d="M20 9C15.58 9 12 12.58 12 17C12 22.25 20 31 20 31C20 31 28 22.25 28 17C28 12.58 24.42 9 20 9Z"
        fill={accentColor}
        fillOpacity="0.2"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner beacon point */}
      <circle cx="20" cy="17" r="3" fill="#ffffff" />
    </svg>
  );
};

export default LogoIcon;
