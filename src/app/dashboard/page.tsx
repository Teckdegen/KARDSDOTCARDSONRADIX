'use client';

import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import Header from '@/components/Header';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen pb-20 p-3 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <Header title="Dashboard" showBack={false} />

        <GlassCard className="space-y-3">
          <h1 className="text-lg font-semibold">Overview</h1>
          <p className="text-sm text-white/60">
            This is your main overview screen. From here you can manage your cards, view referrals, and
            access support.
          </p>
        </GlassCard>

        <GlassCard className="space-y-3">
          <h2 className="text-sm font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link href="/cards" className="glass-card p-3 rounded-xl text-center hover:bg-white/10 transition">
              <p className="font-medium">View Cards</p>
              <p className="text-xs text-white/60 mt-1">Manage and top up your cards</p>
            </Link>
            <Link href="/cards/create" className="glass-card p-3 rounded-xl text-center hover:bg-white/10 transition">
              <p className="font-medium">Create Card</p>
              <p className="text-xs text-white/60 mt-1">Open a new virtual or physical card</p>
            </Link>
            <Link href="/referrals" className="glass-card p-3 rounded-xl text-center hover:bg-white/10 transition">
              <p className="font-medium">Referrals</p>
              <p className="text-xs text-white/60 mt-1">Share and earn from referrals</p>
            </Link>
            <Link href="/support" className="glass-card p-3 rounded-xl text-center hover:bg-white/10 transition">
              <p className="font-medium">Support</p>
              <p className="text-xs text-white/60 mt-1">Get help and FAQs</p>
            </Link>
          </div>
        </GlassCard>
      </div>

      <BottomNav />
    </div>
  );
}


