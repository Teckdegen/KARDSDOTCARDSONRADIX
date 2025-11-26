import React from 'react';
import Logo from './Logo';
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
      <div className="flex items-center justify-center gap-3 pt-8 pb-6 fade-in">
        <Logo size={40} className="rounded-2xl" />
        {title && (
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#F5F5DC' }}>{title}</h1>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between pt-8 pb-6 fade-in">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center glass-card hover:bg-white/10 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-white/70" />
          </button>
        )}
        <Logo size={32} className="rounded-xl" />
        {title && (
          <h1 className="text-2xl font-bold" style={{ color: '#F5F5DC' }}>{title}</h1>
        )}
      </div>
      {rightAction && (
        <div>{rightAction}</div>
      )}
    </div>
  );
}

