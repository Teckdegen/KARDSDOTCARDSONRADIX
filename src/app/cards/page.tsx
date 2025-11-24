'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import Logo from '@/components/Logo';
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
    <div className="min-h-screen pb-20 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between pt-8">
          <div className="flex items-center gap-3">
            <Logo size={28} className="rounded-xl" />
            <h1 className="text-2xl font-bold" style={{ color: '#F5F5DC' }}>My Cards</h1>
          </div>
          <Link href="/cards/create">
            <GlassButton variant="primary" className="flex items-center gap-2 px-4 py-2">
              <Plus size={18} />
              <span className="hidden sm:inline">Create</span>
            </GlassButton>
          </Link>
        </div>

        {cards.length === 0 ? (
          <GlassCard className="text-center py-12">
            <CreditCard className="mx-auto mb-4" size={48} style={{ color: '#F5F5DC' }} />
            <p className="text-white/60 mb-4">No cards yet</p>
            <Link href="/cards/create">
              <GlassButton variant="primary">Create Your First Card</GlassButton>
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <Link key={card.id} href={`/cards/${card.card_code}`}>
                <GlassCard className="cursor-pointer hover:scale-105 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard size={24} style={{ color: '#F5F5DC' }} />
                        <h3 className="text-lg font-semibold">{card.card_name}</h3>
                      </div>
                      <p className="text-white/60 text-sm mb-1">
                        {card.card_brand} •••• {card.last4 || 'XXXX'}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div>
                          <p className="text-white/60 text-xs">Balance</p>
                          <p className="text-xl font-bold">${card.balance?.toFixed(2) || '0.00'}</p>
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
        )}

        {cards.length >= 4 && (
          <GlassCard className="bg-yellow-500/10 border-yellow-500/30">
            <p className="text-yellow-400 text-sm text-center">
              You've reached the maximum of 4 cards
            </p>
          </GlassCard>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

