'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassInput from '@/components/GlassInput';
import GlassButton from '@/components/GlassButton';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function TopUpPage() {
  const router = useRouter();
  const params = useParams();
  const cardCode = params.cardCode as string;
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (!amount || amountNum < 6) {
      setMessage('Minimum top-up amount is $6 USDC');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cards/${cardCode}/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amountNum }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Top-up initiated! Processing...');
        setTimeout(() => {
          router.push(`/cards/${cardCode}`);
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to top up card');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const processingFee = 2.5;
  const cardAmount = amount ? Math.max(0, parseFloat(amount) - processingFee) : 0;

  return (
    <div className="min-h-screen pb-20 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4 pt-8">
          <Link href={`/cards/${cardCode}`}>
            <ArrowLeft size={24} className="text-white/60 hover:text-white transition" />
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: '#F5F5DC' }}>Top Up Card</h1>
        </div>

        <form onSubmit={handleTopUp}>
          <GlassCard className="space-y-6">
            <div className="text-center">
              <TrendingUp className="mx-auto mb-4" size={48} style={{ color: '#F5F5DC' }} />
              <p className="text-white/60 text-sm mb-2">Enter amount to top up</p>
              <p className="text-xs text-white/40">Minimum: $6 USDC</p>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Amount (USDC)</label>
              <GlassInput
                type="number"
                placeholder="6.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="6"
                step="0.01"
                required
              />
            </div>

            {amount && parseFloat(amount) >= 6 && (
              <GlassCard className="bg-white/5 border-white/10">
                <h3 className="text-sm font-semibold mb-3">Payment Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Top-up Amount</span>
                    <span>${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Processing Fee</span>
                    <span>${processingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 font-semibold">
                    <span>Card Balance</span>
                    <span className="text-green-400">+${cardAmount.toFixed(2)}</span>
                  </div>
                </div>
              </GlassCard>
            )}

            {message && (
              <p className={`text-sm text-center ${
                message.includes('error') || message.includes('Failed') 
                  ? 'text-red-400' 
                  : 'text-green-400'
              }`}>
                {message}
              </p>
            )}

            <GlassButton
              type="submit"
              disabled={loading || !amount || parseFloat(amount) < 6}
              variant="primary"
              className="w-full"
            >
              {loading ? 'Processing...' : 'Confirm Top Up'}
            </GlassButton>
          </GlassCard>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}

