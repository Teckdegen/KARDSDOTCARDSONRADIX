'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import Header from '@/components/Header';
import { CreditCard, Plus } from 'lucide-react';
import Link from 'next/link';

interface Card {
  id: string;
  card_code: string;
  card_name: string;
  last4: string;
  balance: number;
  status: string;
  card_brand: string;
}

export default function CardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchCards();
  }, [router]);

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cards', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setCards(data.cards || []);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'frozen':
        return 'text-yellow-400';
      case 'processing':
        return 'text-blue-400';
      default:
        return 'text-white/60';
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
      {/* 
         Max-width constrained to 'md' (approx 450-500px) to simulate 
         the mobile app feeling on Desktop (MoonPay style) 
      */}
      <div className="w-full max-w-md mx-auto space-y-8">
        <Header
          title="Overview"
        />

        {/* Dashboard Summary Section */}
        <div className="text-center space-y-1">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Total Balance</p>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            ${cards.reduce((acc, card) => acc + (card.balance || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold">
              +2.4%
            </span>
            <span className="text-white/30 text-[10px]">vs last month</span>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Add Card', icon: Plus, color: 'bg-[#F5F5DC]', textColor: 'text-[#0A0E27]' },
            { label: 'Top Up', icon: CreditCard, color: 'bg-white/5', textColor: 'text-white' },
            { label: 'Send', icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>, color: 'bg-white/5', textColor: 'text-white' },
            { label: 'More', icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>, color: 'bg-white/5', textColor: 'text-white' },
          ].map((action, i) => (
            <button key={i} className="flex flex-col items-center gap-2 group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.color} shadow-lg transition-transform group-active:scale-95`}>
                <action.icon size={24} className={action.textColor} />
              </div>
              <span className="text-[10px] font-medium text-white/60">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Cards Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-white">Your Cards</h2>
            <Link href="/cards/create" className="text-[#F5F5DC] text-xs font-semibold">
              + Add New
            </Link>
          </div>

          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <GlassCard className="text-center p-6 w-full border-dashed border-2 border-white/10 !bg-transparent">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <CreditCard size={20} className="text-white/40" />
                </div>
                <p className="text-white/60 mb-4 text-sm font-medium">No active cards</p>
                <Link href="/cards/create">
                  <GlassButton variant="primary" className="!py-3 !px-6 !text-sm !font-bold">
                    Create Card
                  </GlassButton>
                </Link>
              </GlassCard>
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <Link key={card.id} href={`/cards/${card.card_code}`}>
                  <GlassCard className="cursor-pointer hover:bg-white/5 transition p-4 relative overflow-hidden group !border-white/5 !rounded-[24px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/5">
                          <CreditCard size={20} className="text-[#F5F5DC]" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{card.card_name}</h3>
                          <p className="text-white/40 text-xs font-mono">**** {card.last4 || '0000'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-white">${card.balance?.toFixed(2)}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wide ${getStatusColor(card.status)}`}>{card.status}</p>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity (Mock) */}
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-white">Recent Activity</h2>
            <span className="text-white/40 text-xs font-medium">See All</span>
          </div>

          <div className="space-y-0">
            {[
              { name: 'Spotify Premium', date: 'Today, 9:41 AM', amount: '-$14.99', type: 'sub' },
              { name: 'Uber Top Up', date: 'Yesterday, 8:30 PM', amount: '+$50.00', type: 'add' },
              { name: 'Apple Store', date: 'Dec 12, 4:20 PM', amount: '-$1,299.00', type: 'buy' }
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    {tx.type === 'add' ? (
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                    ) : (
                      <div className="w-2 h-2 bg-[#F5F5DC] rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{tx.name}</p>
                    <p className="text-white/30 text-[10px]">{tx.date}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${tx.type === 'add' ? 'text-green-400' : 'text-white'}`}>
                  {tx.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}