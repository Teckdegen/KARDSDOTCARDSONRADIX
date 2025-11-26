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
  const [claimMessage, setClaimMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchReferralData();
  }, [router]);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch referral code
      const codeRes = await fetch('/api/referral/code', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (codeRes.ok) {
        const codeData = await codeRes.json();
        setReferralCode(codeData.referralCode);
      }

      // Fetch stats
      const statsRes = await fetch('/api/referral/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch leaderboard
      const leaderboardRes = await fetch('/api/referral/leaderboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    setClaiming(true);
    setClaimMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        setClaimMessage('Rewards claimed successfully!');
        fetchReferralData(); // Refresh data
      } else {
        setClaimMessage('Failed to claim rewards');
      }
    } catch (error) {
      setClaimMessage('Error claiming rewards');
      console.error('Error claiming rewards:', error);
    } finally {
      setClaiming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header title="Referrals" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20">
      <Header title="Referrals" />
      
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Referral Code Card */}
        <GlassCard className="glass-card-reduced p-6">
          <div className="text-center mb-4">
            <Trophy className="mx-auto mb-2" size={20} style={{ color: '#F5F5DC' }} />
            <p className="text-white/50 text-xs mb-2">Your Referral Code</p>
            <p 
              className="text-sm font-bold font-mono mb-3 cursor-pointer hover:text-accent transition-colors"
              onClick={() => copyToClipboard(referralCode)}
              onContextMenu={(e) => {
                e.preventDefault();
                copyToClipboard(referralCode);
              }}
            >
              {referralCode}
            </p>
            <p className="text-white/40 text-[10px]">Tap to copy</p>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <Users size={16} className="mx-auto mb-1" style={{ color: '#F5F5DC' }} />
              <p className="text-white/50 text-[10px]">Referred</p>
              <p className="text-xs font-bold">{stats?.referralCount || 0}</p>
            </div>
            
            {/* Earnings on the same line */}
            <div className="flex gap-6">
              <div className="text-center">
                <DollarSign size={16} className="mx-auto mb-1" style={{ color: '#F5F5DC' }} />
                <p className="text-white/50 text-[10px]">This Week</p>
                <p className="text-xs font-bold">${stats?.weeklyEarnings.toFixed(2) || '0.00'}</p>
              </div>
              
              <div className="text-center">
                <Gift size={16} className="mx-auto mb-1" style={{ color: '#F5F5DC' }} />
                <p className="text-white/50 text-[10px]">All Time</p>
                <p className="text-xs font-bold">${stats?.allTimeEarnings.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
          
          <GlassButton 
            onClick={handleClaimRewards}
            disabled={claiming}
            className="w-full py-2 text-sm"
          >
            {claiming ? 'Claiming...' : 'Claim Rewards'}
          </GlassButton>
          
          {claimMessage && (
            <p className={`text-center mt-2 text-xs ${claimMessage.includes('successfully') ? 'text-success' : 'text-danger'}`}>
              {claimMessage}
            </p>
          )}
        </GlassCard>

        {/* Leaderboard moved to the bottom */}
        <GlassCard className="glass-card-reduced p-6">
          <div className="flex items-center mb-4">
            <Award className="mr-2" size={18} style={{ color: '#F5F5DC' }} />
            <h2 className="text-base font-bold">Leaderboard</h2>
          </div>
          
          <div className="space-y-3">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <div className="flex items-center">
                    <span className="text-xs font-bold mr-3 w-5">#{entry.rank}</span>
                    <span className="text-xs font-mono">{entry.referralCode}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">${entry.weeklyEarnings.toFixed(2)}</p>
                    <p className="text-[10px] text-white/50">{entry.referralCount} referrals</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/50 text-center text-xs py-4">No leaderboard data available</p>
            )}
          </div>
        </GlassCard>
      </main>
      
      <BottomNav />
    </div>
  );
}