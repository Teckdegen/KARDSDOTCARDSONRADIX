'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, Trophy, HelpCircle, Settings } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/cards', icon: CreditCard, label: 'Cards' },
  { href: '/referrals', icon: Trophy, label: 'Referrals' },
  { href: '/support', icon: HelpCircle, label: 'Support' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav">
      <div className="glass-card rounded-t-3xl border-t border-white/20 p-1 mx-0 max-w-full">
        <div className="flex items-center justify-center w-full">
          <div className="flex items-center justify-evenly w-full max-w-md mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 transition-all duration-200 relative group ${
                    isActive ? 'text-[#F5F5DC]' : 'text-white/50'
                  }`}
                >
                <div className={`relative transition-all duration-200 ${
                  isActive ? 'scale-110' : ''
                }`}>
                  <Icon size={16} className="relative z-10" />
                  {isActive && (
                    <div className="absolute inset-0 bg-[#F5F5DC]/20 blur-xl rounded-full -z-10" />
                  )}
                </div>
                <span className={`text-[8px] font-medium transition-all duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-60'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#F5F5DC] rounded-full" />
                )}
              </Link>
            );
          })}
          </div>
        </div>
      </div>
    </nav>
  );
}
