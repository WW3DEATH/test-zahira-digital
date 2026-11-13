import React, { useState } from 'react';

interface ZahiraLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ZahiraLogoProps['size']>, string> = {
  xs: 'w-7 h-7 rounded-lg p-0.5',
  sm: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl p-0.5',
  md: 'w-12 h-12 rounded-2xl p-1',
  lg: 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1.5',
};

export const ZahiraLogo: React.FC<ZahiraLogoProps> = ({ size = 'sm', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`bg-white border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center overflow-hidden shrink-0 ${SIZE_CLASSES[size]} ${className}`}
      title="Zahira College Mawanella Official Logo"
    >
      {!imgError ? (
        <img
          src="/assets/aistudio/image_27ea2622.png"
          alt="Zahira College Mawanella Official Logo"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain select-none scale-110"
        />
      ) : (
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full" aria-hidden="true">
          <circle cx="32" cy="32" r="24" stroke="#13295B" strokeWidth="3" />
          <rect x="20" y="20" width="12" height="12" fill="#7B1123" />
          <rect x="32" y="32" width="12" height="12" fill="#13295B" />
        </svg>
      )}
    </div>
  );
};
