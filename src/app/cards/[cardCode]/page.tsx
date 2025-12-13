'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import Header from '@/components/Header';
import { CreditCard, TrendingUp, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';

interface CardDetails {
  card_code: string;
  card_name: string;
  card_brand: string;
  card_type: string;
  balance: number;
  last4: string;
  expiry_on: string;
  status: string;
  cardNumber?: string;
  cvV2?: string;
}

interface Transaction {
  code: string;
  description: string;
  amount: number;
  status: string;
  createdOn: string;
  category: string;
}

export default function CardDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const cardCode = params.cardCode as string;

  const [card, setCard] = useState<CardDetails | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchCardDetails();
    fetchTransactions();
  }, [cardCode, router]);

  const fetchCardDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cards/${cardCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setCard(data.card);
      }
    } catch (error) {
      console.error('Error fetching card details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cards/${cardCode}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleFreeze = async () => {
    setFreezing(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = card?.status === 'frozen' ? 'unfreeze' : 'freeze';
      const response = await fetch(`/api/cards/${cardCode}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchCardDetails();
      }
    } catch (error) {
      console.error('Error freezing/unfreezing card:', error);
    } finally {
      setFreezing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Card not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 p-3 flex items-center justify-center">
      <div className="w-full max-w-[440px] mx-auto space-y-6">
        <Header title={card.card_name} showBack backUrl="/cards" centered />

        {/* Card Visual */}
        <div className="relative h-56 w-full perspective-1000">
          <div className="w-full h-full rounded-[32px] bg-gradient-to-bl from-[#0A0E27] to-black border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 group transition-transform hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full -mr-12 -mt-12 pointer-events-none" />

            <div className="flex justify-between items-start z-10">
              <CreditCard className="text-[#F5F5DC]" size={28} />
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${card.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {card.status}
                </span>
              </div>
            </div>

            <div className="z-10 text-center">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Current Balance</p>
              <h1 className="text-4xl font-bold text-white tracking-tight">${card.balance?.toFixed(2)}</h1>
            </div>

            <div className="flex justify-between items-end z-10">
              <div>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Card Number</p>
                <p className="font-mono text-white/90 tracking-wider">•••• {card.last4 || 'XXXX'}</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Expires</p>
                <p className="font-mono text-white/90">{card.expiry_on ? new Date(card.expiry_on).toLocaleDateString(undefined, { month: '2-digit', year: '2-digit' }) : 'MM/YY'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/cards/${cardCode}/topup`} className="group">
            <div className="bg-[#F5F5DC] rounded-3xl p-4 flex flex-col items-center justify-center gap-2 h-24 hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[#F5F5DC]/10">
              <TrendingUp size={24} className="text-[#0A0E27]" />
              <span className="text-[#0A0E27] font-bold text-sm">Top Up</span>
            </div>
          </Link>
          <button onClick={handleFreeze} disabled={freezing} className="group w-full">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 h-24 hover:bg-white/10 transition-all active:scale-95">
              {card.status === 'frozen' ? <Unlock size={24} className="text-white" /> : <Lock size={24} className="text-white" />}
              <span className="text-white font-bold text-sm">{card.status === 'frozen' ? 'Unfreeze' : 'Freeze'}</span>
            </div>
          </button>
        </div>

        {/* Transactions List */}
        <div className="bg-[#0F142D]/50 border border-white/5 rounded-[32px] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white">Latest Transactions</h3>
            <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
              <ChevronRight size={14} className="text-white/60" />
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard size={20} className="text-white/20" />
              </div>
              <p className="text-white/40 text-sm font-medium">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.code} className="flex items-center justify-between group cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                      {/* Simple category icon logic placeholder */}
                      <div className="w-2 h-2 rounded-full bg-[#F5F5DC]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">{tx.description}</p>
                      <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">
                        {new Date(tx.createdOn).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.status === 'success' ? 'text-white' : 'text-red-400'}`}>
                      -${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-white/30 text-[10px] font-medium">{tx.status}</p>
                  </div>
                </div>
              ))}

              <button className="w-full py-3 mt-2 text-xs font-semibold text-white/40 hover:text-white transition-colors">
                View All History
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

