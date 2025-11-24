import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <img 
      src="https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg" 
      alt="KARDS Logo" 
      className={`rounded-2xl object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

