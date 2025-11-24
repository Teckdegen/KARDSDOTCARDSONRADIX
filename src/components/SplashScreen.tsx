'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        onFinish();
      }, 500);
    }, 2000); // Show for 2 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center">
        <img 
          src="https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg" 
          alt="KARDS Logo" 
          className="w-40 h-40 mx-auto mb-8 rounded-3xl object-cover animate-pulse"
        />
        <p className="text-white/60 text-sm font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

