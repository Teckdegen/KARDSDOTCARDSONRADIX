'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import Header from '@/components/Header';
import { Trophy, DollarSign, Users, Award, Gift } from 'lucide-react';

interface ReferralStats {
  weeklyEarnings: number;
  allTimeEarnings: number;
  referralCount: number;
}

interface LeaderboardEntry {
  rank: number;
  referralCode: string;
  weeklyEarnings: number;
  referralCount: number;
}

export default function ReferralsPage() {
  const router = useRouter();
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      const [codeRes, statsRes, leaderboardRes] = await Promise.all([
        fetch('/api/referrals/my-code', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/referrals/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/referrals/leaderboard', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (codeRes.ok) {
        const data = await codeRes.json();
        setReferralCode(data.code);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setMessage('Copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClaim = async () => {
    setClaiming(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/referrals/claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success && stats) {
        setMessage(`Successfully claimed $${stats.weeklyEarnings.toFixed(2)}!`);
        fetchData();
      } else {
        setMessage(data.message || 'Failed to claim earnings');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 p-3 flex items-center justify-center">
      <div className="w-full max-w-[440px] mx-auto space-y-6">
        <Header title="Referrals" centered />

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[32px] p-6 bg-gradient-to-tr from-[#9945FF]/20 to-[#14F195]/20 border border-white/10">
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-xl">
              <Gift size={32} className="text-[#F5F5DC]" />
            </div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Total Earnings</p>
            <h1 className="text-4xl font-bold text-white mb-2">${stats?.allTimeEarnings.toFixed(2) || '0.00'}</h1>
            <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20">
                +{stats?.weeklyEarnings.toFixed(2) || '0.00'} this week
              </span>
            </div>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-[#0F142D]/50 border border-white/5 rounded-[32px] p-6 text-center">
          <h3 className="text-white font-bold mb-4">Your Referral Link</h3>
          <div
            onClick={copyCode}
            className="bg-black/30 border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-95 transition-transform group"
          >
            <span className="text-white/60 text-sm font-mono truncate mr-2">{referralCode || 'Loading...'}</span>
            <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
              <Users size={16} className="text-white" />
            </div>
          </div>
          <p className="text-white/30 text-[10px] mt-3">Tap to copy and share directly</p>
        </div>

        {/* Leaderboard or Claim */}
        {stats && stats.weeklyEarnings > 0 ? (
          <GlassButton
            variant="primary"
            onClick={handleClaim}
            disabled={claiming}
            className="w-full flex items-center justify-center gap-2 !py-4 !text-base !font-bold"
          >
            <Award size={20} />
            {claiming ? 'Claiming...' : `Claim $${stats.weeklyEarnings.toFixed(2)}`}
          </GlassButton>
        ) : (
          <div className="bg-[#0F142D]/50 border border-white/5 rounded-[32px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Top Earners</h3>
              <Award size={18} className="text-[#F5F5DC]" />
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-white/40 text-xs text-center py-4">Leaderboard updating...</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 3).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-4 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : 'text-orange-400'}`}>#{i + 1}</span>
                      <span className="text-sm font-medium text-white">{entry.referralCode}</span>
                    </div>
                    <span className="text-sm font-bold text-[#F5F5DC]">${entry.weeklyEarnings.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 text-white font-medium text-sm transition-all duration-300 pointer-events-none ${message ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {message}
      </div>

      <BottomNav />
    </div>
  );
}