'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import Header from '@/components/Header';
import { Trophy, Copy, Share2, DollarSign, Users, Award, Gift } from 'lucide-react';

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

  const shareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join KARDS with my referral code',
        text: `Use my referral code: ${referralCode}`,
      });
    } else {
      copyCode();
    }
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
    <div className="min-h-screen pb-20 p-3">
      <div className="w-full max-w-4xl mx-auto space-y-3">
        <Header title="Referrals" centered />

        <GlassCard>
          <div className="text-center mb-3">
            <Trophy className="mx-auto mb-2" size={24} style={{ color: '#F5F5DC' }} />
            <p className="text-white/60 text-xs mb-1.5">Your Referral Code</p>
            <p className="text-lg font-bold font-mono mb-3">{referralCode}</p>
            <div className="flex gap-2 justify-center">
              <GlassButton variant="secondary" onClick={copyCode} className="flex items-center gap-1.5 text-xs px-3 py-1.5">
                <Copy size={12} />
                Copy
              </GlassButton>
              <GlassButton variant="secondary" onClick={shareCode} className="flex items-center gap-1.5 text-xs px-3 py-1.5">
                <Share2 size={12} />
                Share
              </GlassButton>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-[#F5F5DC]/10 to-[#F5F5DC]/5 border-2 border-[#F5F5DC]/30">
          <div className="text-center mb-3">
            <Gift className="mx-auto mb-1.5" size={20} style={{ color: '#F5F5DC' }} />
            <p className="text-white/60 text-xs mb-1">Total Cashback Earned</p>
            <p className="text-xl font-bold mb-1.5" style={{ color: '#F5F5DC' }}>
              ${stats?.allTimeEarnings.toFixed(2) || '0.00'}
            </p>
            {stats && stats.weeklyEarnings > 0 && (
              <p className="text-xs text-white/70">
                ${stats.weeklyEarnings.toFixed(2)} available to claim this week
              </p>
            )}
          </div>
        </GlassCard>

        <div className="grid grid-cols-3 gap-2">
          <GlassCard className="text-center p-3">
            <DollarSign className="mx-auto mb-1.5" size={16} style={{ color: '#F5F5DC' }} />
            <p className="text-white/60 text-xs mb-1">This Week</p>
            <p className="text-sm font-bold">${stats?.weeklyEarnings.toFixed(2) || '0.00'}</p>
          </GlassCard>
          <GlassCard className="text-center p-3">
            <Award className="mx-auto mb-1.5" size={16} style={{ color: '#F5F5DC' }} />
            <p className="text-white/60 text-xs mb-1">Available</p>
            <p className="text-sm font-bold" style={{ color: '#F5F5DC' }}>
              ${stats?.weeklyEarnings.toFixed(2) || '0.00'}
            </p>
          </GlassCard>
          <GlassCard className="text-center p-3">
            <Users className="mx-auto mb-1.5" size={16} style={{ color: '#F5F5DC' }} />
            <p className="text-white/60 text-xs mb-1">Referrals</p>
            <p className="text-sm font-bold">{stats?.referralCount || 0}</p>
          </GlassCard>
        </div>

        {stats && stats.weeklyEarnings > 0 && (
          <GlassButton
            variant="primary"
            onClick={handleClaim}
            disabled={claiming}
            className="w-full flex items-center justify-center gap-1.5 text-sm py-2"
          >
            <Award size={14} />
            {claiming ? 'Claiming...' : `Claim $${stats.weeklyEarnings.toFixed(2)}`}
          </GlassButton>
        )}

        <GlassCard>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Trophy size={16} style={{ color: '#F5F5DC' }} />
            Weekly Leaderboard
          </h3>
          {leaderboard.length === 0 ? (
            <p className="text-white/60 text-sm text-center py-4">No leaderboard data yet</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      entry.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                      entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {entry.rank}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{entry.referralCode}</p>
                      <p className="text-white/60 text-xs">{entry.referralCount} referrals</p>
                    </div>
                  </div>
                  <p className="font-semibold text-sm">${entry.weeklyEarnings.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {message && (
          <GlassCard className={`${message.includes('Successfully') ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
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

