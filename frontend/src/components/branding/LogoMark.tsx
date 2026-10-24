import React from 'react';
import LogoIcon from './LogoIcon';

interface LogoMarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark' | 'monochrome';
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 'md',
  theme = 'dark',
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center justify-center rounded-xl p-1.5 transition-all ${className}`}>
      <LogoIcon size={size} theme={theme} />
    </div>
  );
};

export default LogoMark;

