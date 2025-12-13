'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, Trophy, HelpCircle, Settings } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/cards', icon: CreditCard, label: 'Cards' },
  { href: '/referrals', icon: Trophy, label: 'Referrals' },
  { href: '/support', icon: HelpCircle, label: 'Support' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 px-6 pointer-events-none">
      <div className="glass-card !rounded-full !py-3 !px-6 mx-auto max-w-[320px] pointer-events-auto shadow-2xl shadow-black/50 border border-white/10 backdrop-blur-xl bg-[#0A0E27]/80">
        <div className="flex items-center justify-between w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-10 h-10 transition-all duration-300 relative group ${isActive ? 'text-[#0A0E27]' : 'text-white/40 hover:text-white/80'
                  }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-[#F5F5DC] rounded-full scale-100 transition-transform duration-300" />
                )}
                <Icon size={20} className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-[#0A0E27]' : ''}`} />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
