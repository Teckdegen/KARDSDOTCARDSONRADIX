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
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Header title="Referrals" centered />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="glass-card-reduced p-6">
              <div className="text-center">
                <Trophy className="mx-auto mb-3" size={28} style={{ color: '#F5F5DC' }} />
                <h2 className="text-xl font-bold mb-2">Your Referral Code</h2>
                <p className="text-white/50 text-sm mb-4">Share this code to earn rewards</p>
                <p
                  className="text-lg font-bold font-mono mb-3 bg-white/5 p-4 rounded-xl cursor-pointer"
                  onClick={copyCode}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    copyCode();
                  }}
                >
                  {referralCode}
                </p>
                <p className="text-white/40 text-sm">Tap to copy</p>
              </div>
            </GlassCard>

            <GlassCard className="glass-card-reduced p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy size={22} style={{ color: '#F5F5DC' }} />
                Weekly Leaderboard
              </h3>
              {leaderboard.length === 0 ? (
                <p className="text-white/50 text-center py-6">No leaderboard data yet</p>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((entry) => (
                    <div key={entry.rank} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                          entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                          entry.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                          entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-white/10 text-white/60'
                        }`}>
                          {entry.rank}
                        </div>
                        <div>
                          <p className="font-medium text-base">{entry.referralCode}</p>
                          <p className="text-white/50 text-sm">{entry.referralCount} referrals</p>
                        </div>
                      </div>
                      <p className="font-semibold text-base">${entry.weeklyEarnings.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="glass-card-reduced p-6">
              <div className="text-center">
                <Gift className="mx-auto mb-3" size={28} style={{ color: '#F5F5DC' }} />
                <h2 className="text-xl font-bold mb-2">Total Cashback Earned</h2>
                <p className="text-3xl font-bold my-3" style={{ color: '#F5F5DC' }}>
                  ${stats?.allTimeEarnings.toFixed(2) || '0.00'}
                </p>
                {stats && stats.weeklyEarnings > 0 && (
                  <p className="text-sm text-white/60 mt-2">
                    ${stats.weeklyEarnings.toFixed(2)} available to claim this week
                  </p>
                )}
              </div>
            </GlassCard>

            <div className="space-y-4">
              <GlassCard className="glass-card-reduced p-5 text-center">
                <DollarSign className="mx-auto mb-2" size={22} style={{ color: '#F5F5DC' }} />
                <p className="text-white/50 text-sm mb-1">This Week</p>
                <p className="text-xl font-bold">${stats?.weeklyEarnings.toFixed(2) || '0.00'}</p>
              </GlassCard>
              <GlassCard className="glass-card-reduced p-5 text-center">
                <Award className="mx-auto mb-2" size={22} style={{ color: '#F5F5DC' }} />
                <p className="text-white/50 text-sm mb-1">Available</p>
                <p className="text-xl font-bold" style={{ color: '#F5F5DC' }}>
                  ${stats?.weeklyEarnings.toFixed(2) || '0.00'}
                </p>
              </GlassCard>
              <GlassCard className="glass-card-reduced p-5 text-center">
                <Users className="mx-auto mb-2" size={22} style={{ color: '#F5F5DC' }} />
                <p className="text-white/50 text-sm mb-1">Referrals</p>
                <p className="text-xl font-bold">{stats?.referralCount || 0}</p>
              </GlassCard>
            </div>

            {stats && stats.weeklyEarnings > 0 && (
              <GlassButton
                variant="primary"
                onClick={handleClaim}
                disabled={claiming}
                className="w-full flex items-center justify-center gap-2 py-4 text-lg"
              >
                <Award size={20} />
                {claiming ? 'Claiming...' : `Claim $${stats.weeklyEarnings.toFixed(2)}`}
              </GlassButton>
            )}
          </div>
        </div>

        {message && (
          <GlassCard className={`glass-card-reduced p-4 ${message.includes('Successfully') ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <p className={`text-center text-lg ${
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