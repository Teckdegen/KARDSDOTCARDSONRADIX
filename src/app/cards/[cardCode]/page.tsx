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
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <Header title="Card Details" showBack backUrl="/cards" />

        <GlassCard>
          <div className="text-center mb-4">
            <CreditCard className="mx-auto mb-3" size={32} style={{ color: '#F5F5DC' }} />
            <h2 className="text-lg font-bold mb-1.5">{card.card_name}</h2>
            <p className="text-white/60 text-xs mb-3">
              {card.card_brand} {card.card_type}
            </p>
            <div className="text-2xl font-bold mb-1.5">
              ${card.balance?.toFixed(2) || '0.00'}
            </div>
            <p className="text-white/60 text-xs">Balance</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-white/60 text-xs mb-1">Card Number</p>
              <p className="font-mono">•••• {card.last4 || 'XXXX'}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">Expiry</p>
              <p>{card.expiry_on ? new Date(card.expiry_on).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={`/cards/${cardCode}/topup`} className="flex-1">
              <GlassButton variant="primary" className="w-full flex items-center justify-center gap-2">
                <TrendingUp size={16} />
                Top Up
              </GlassButton>
            </Link>
            <GlassButton
              variant="secondary"
              onClick={handleFreeze}
              disabled={freezing}
              className="flex items-center justify-center gap-2"
            >
              {card.status === 'frozen' ? <Unlock size={16} /> : <Lock size={16} />}
              {card.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
            </GlassButton>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold mb-3">Transactions</h3>
          {transactions.length === 0 ? (
            <p className="text-white/60 text-sm text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.code} className="flex items-center justify-between pb-3 border-b border-white/10 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-white/60 text-xs">
                      {new Date(tx.createdOn).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      ${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-white/60 text-xs">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <BottomNav />
    </div>
  );
}

