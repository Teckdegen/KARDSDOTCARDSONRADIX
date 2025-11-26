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
        fetch('/api/referrals/leaderboard'),
      ]);

      const codeData = await codeRes.json();
      const statsData = await statsRes.json();
      const leaderboardData = await leaderboardRes.json();

      if (codeData.success) setReferralCode(codeData.referralCode);
      if (statsData.success) setStats(statsData);
      if (leaderboardData.success) setLeaderboard(leaderboardData.leaderboard);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setMessage('Referral code copied!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClaim = async () => {
    if (!stats || stats.weeklyEarnings <= 0) {
      setMessage('No earnings to claim');
      return;
    }

    setClaiming(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/referrals/claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
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
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <Header title="Referrals" centered />

        <GlassCard className="glass-card-reduced p-4">
          <div className="text-center">
            <Trophy className="mx-auto mb-2" size={20} style={{ color: '#F5F5DC' }} />
            <p className="text-white/50 text-xs mb-2">Your Referral Code</p>
            <p 
              className="text-sm font-bold font-mono mb-2 bg-white/5 p-3 rounded-xl cursor-pointer"
              onClick={copyCode}
              onContextMenu={(e) => {
                e.preventDefault();
                copyCode();
              }}
            >
              {referralCode}
            </p>
            <p className="text-white/40 text-[10px]">Tap to copy</p>
          </div>
        </GlassCard>

        <GlassCard className="glass-card-reduced p-4">
          <div className="text-center">
            <Gift className="mx-auto mb-2" size={20} style={{ color: '#F5F5DC' }} />
            <p className="text-white/50 text-xs mb-1">Total Cashback Earned</p>
            <p className="text-xl font-bold mb-1" style={{ color: '#F5F5DC' }}>
              ${stats?.allTimeEarnings.toFixed(2) || '0.00'}
            </p>
            {stats && stats.weeklyEarnings > 0 && (
              <p className="text-xs text-white/60 mt-2">
                ${stats.weeklyEarnings.toFixed(2)} available to claim this week
              </p>
            )}
          </div>
        </GlassCard>

        <div className="grid grid-cols-3 gap-2">
          <GlassCard className="glass-card-reduced p-3 text-center">
            <DollarSign className="mx-auto mb-1" size={16} style={{ color: '#F5F5DC' }} />
            <p className="text-white/50 text-[10px] mb-1">This Week</p>
            <p className="text-sm font-bold">${stats?.weeklyEarnings.toFixed(2) || '0.00'}</p>
          </GlassCard>
          <GlassCard className="glass-card-reduced p-3 text-center">
            <Award className="mx-auto mb-1" size={16} style={{ color: '#F5F5DC' }} />
            <p className="text-white/50 text-[10px] mb-1">Available</p>
            <p className="text-sm font-bold" style={{ color: '#F5F5DC' }}>
              ${stats?.weeklyEarnings.toFixed(2) || '0.00'}
            </p>
          </GlassCard>
          <GlassCard className="glass-card-reduced p-3 text-center">
            <Users className="mx-auto mb-1" size={16} style={{ color: '#F5F5DC' }} />
            <p className="text-white/50 text-[10px] mb-1">Referrals</p>
            <p className="text-sm font-bold">{stats?.referralCount || 0}</p>
          </GlassCard>
        </div>

        {stats && stats.weeklyEarnings > 0 && (
          <GlassButton
            variant="primary"
            onClick={handleClaim}
            disabled={claiming}
            className="w-full flex items-center justify-center gap-2 py-3"
          >
            <Award size={16} />
            {claiming ? 'Claiming...' : `Claim $${stats.weeklyEarnings.toFixed(2)}`}
          </GlassButton>
        )}

        <GlassCard className="glass-card-reduced p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Trophy size={18} style={{ color: '#F5F5DC' }} />
            Weekly Leaderboard
          </h3>
          {leaderboard.length === 0 ? (
            <p className="text-white/50 text-sm text-center py-4">No leaderboard data yet</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                      entry.rank === 1 ? 'bg-yellow-500/10 text-yellow-400' :
                      entry.rank === 2 ? 'bg-gray-400/10 text-gray-400' :
                      entry.rank === 3 ? 'bg-orange-500/10 text-orange-400' :
                      'bg-white/5 text-white/50'
                    }`}>
                      {entry.rank}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{entry.referralCode}</p>
                      <p className="text-white/50 text-xs">{entry.referralCount} referrals</p>
                    </div>
                  </div>
                  <p className="font-semibold text-sm">${entry.weeklyEarnings.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {message && (
          <GlassCard className={`glass-card-reduced p-3 ${message.includes('Successfully') ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <p className={`text-sm text-center ${
              message.includes('Successfully') ? 'text-green-400' : 'text-red-400'
            }`}>
              {message}
            </p>
          </GlassCard>
        )}
      </div>

      <BottomNav />
    </div>
  );
}