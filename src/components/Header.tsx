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
    <div className="flex items-center justify-between pt-6 pb-2 fade-in">
      <div className="flex items-center gap-2">
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
      {rightAction && (
        <div>{rightAction}</div>
      )}
    </div>
  );
}

