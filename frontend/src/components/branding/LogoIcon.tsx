import React from 'react';

interface LogoIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  theme?: 'light' | 'dark' | 'monochrome';
}

export const LogoIcon: React.FC<LogoIconProps> = ({ 
  size = 'md', 
  className = '',
  theme = 'dark'
}) => {
  let dimension = 32;
  if (typeof size === 'number') {
    dimension = size;
  } else if (size === 'sm') {
    dimension = 24;
  } else if (size === 'md') {
    dimension = 36;
  } else if (size === 'lg') {
    dimension = 48;
  } else if (size === 'xl') {
    dimension = 64;
  }

  // Color selection based on theme
  const isMonochrome = theme === 'monochrome';
  const pinFill = isMonochrome ? '#334155' : 'url(#khoj-grad-primary)';
  const bridgeStroke = isMonochrome ? '#0F172A' : '#06B6D4';
  const lensStroke = isMonochrome ? '#475569' : '#38BDF8';
  const nodeFill = isMonochrome ? '#0F172A' : '#F59E0B';

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-200 ${className}`}
      aria-label="ReturnHome Logo Icon"
    >
      <defs>
        {/* Main Gradient: Deep Indigo to Vibrant Teal */}
        <linearGradient id="khoj-grad-primary" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>

        <linearGradient id="khoj-grad-bridge" x1="20" y1="70" x2="80" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>

        <filter id="khoj-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0284C7" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Background Outer Shield / Pin Base */}
      <path
        d="M50 8C31.2 8 16 23.2 16 42C16 63 42 88 48 93.5C49.2 94.6 50.8 94.6 52 93.5C58 88 84 63 84 42C84 23.2 68.8 8 50 8Z"
        fill={pinFill}
        filter={theme === 'dark' ? "url(#khoj-glow)" : undefined}
        opacity={isMonochrome ? 0.95 : 1}
      />

      {/* Internal Magnifying Glass / Lens Ring */}
      <circle
        cx="46"
        cy="38"
        r="18"
        stroke="#FFFFFF"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Magnifying Handle / Connection Pathway */}
      <path
        d="M59 51L72 64"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Connecting Bridge Arc ("Setu") */}
      <path
        d="M26 68C34 58 64 58 74 68"
        stroke={bridgeStroke}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Center Human Safety Node */}
      <circle
        cx="46"
        cy="34"
        r="5"
        fill={nodeFill}
      />

      <path
        d="M38 46C38 42 42 41 46 41C50 41 54 42 54 46"
        stroke={nodeFill}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default LogoIcon;
