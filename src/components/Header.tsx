import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backUrl?: string;
  rightAction?: React.ReactNode;
  centered?: boolean;
}

export default function Header({
  title,
  showBack = false,
  backUrl,
  rightAction,
  centered = false
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  if (centered) {
    return (
      <div className="flex items-center justify-start gap-2 pt-6 pb-2 fade-in">
        {showBack && (
          <button
            onClick={handleBack}
            className="w-5 h-5 rounded-md flex items-center justify-center glass-card hover:bg-white/10 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={10} className="text-white/70" />
          </button>
        )}
        {/* Title intentionally hidden */}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between pt-6 pb-4 fade-in">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full flex items-center justify-center glass-card hover:bg-white/10 transition-colors border border-white/5"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F5F5DC] to-white/80 flex items-center justify-center shadow-lg shadow-[#F5F5DC]/10">
            <span className="text-[#0A0E27] font-bold text-sm">JD</span>
          </div>
        )}
        {title && !centered && (
          <div className="flex flex-col">
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Welcome back</span>
            <h1 className="text-lg font-bold text-white leading-tight">{title}</h1>
          </div>
        )}
      </div>

      {rightAction ? (
        <div>{rightAction}</div>
      ) : (
        !centered && (
          <button className="w-10 h-10 rounded-full flex items-center justify-center glass-card hover:bg-white/10 transition-colors border border-white/5 relative">
            <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border border-[#0A0E27]" />
            {/* Bell icon would be here, assuming it is passed or imported. using a simple svg fallback if needed or just empty for now if I cant import */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
          </button>
        )
      )}
    </div>
  );
}

