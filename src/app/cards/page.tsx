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
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Header 
          title="My Cards" 
          centered
        />

        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <GlassCard className="text-center p-8 max-w-md w-full">
              <CreditCard className="mx-auto mb-4" size={40} style={{ color: '#F5F5DC' }} />
              <h2 className="text-xl font-bold mb-2">No Cards Yet</h2>
              <p className="text-white/60 mb-6 text-sm">Create your first crypto debit card to get started</p>
              <Link href="/cards/create">
                <GlassButton variant="primary" className="w-full flex items-center justify-center gap-2 py-3">
                  <Plus size={20} />
                  Create Your First Card
                </GlassButton>
              </Link>
            </GlassCard>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((card) => (
                <Link key={card.id} href={`/cards/${card.card_code}`}>
                  <GlassCard className="cursor-pointer hover:scale-105 transition p-4 h-full">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard size={20} style={{ color: '#F5F5DC' }} />
                          <h3 className="text-base font-semibold">{card.card_name}</h3>
                        </div>
                        <p className="text-white/60 text-sm mb-2">
                          {card.card_brand} •••• {card.last4 || 'XXXX'}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <div>
                            <p className="text-white/60 text-xs">Balance</p>
                            <p className="text-lg font-bold">${card.balance?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs">Status</p>
                            <p className={`text-sm font-medium ${getStatusColor(card.status)}`}>
                              {card.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
            
            {cards.length < 4 && (
              <Link href="/cards/create">
                <GlassCard className="cursor-pointer hover:scale-105 transition p-6 text-center border-2 border-dashed border-white/20 hover:border-white/40">
                  <Plus className="mx-auto mb-2" size={24} style={{ color: '#F5F5DC' }} />
                  <p className="text-white/60">Create New Card</p>
                </GlassCard>
              </Link>
            )}
          </>
        )}

        {cards.length >= 4 && (
          <GlassCard className="bg-yellow-500/10 border-yellow-500/30 p-4">
            <p className="text-yellow-400 text-center">
              You've reached the maximum of 4 cards
            </p>
          </GlassCard>
        )}
      </div>

      <BottomNav />
    </div>
  );
}