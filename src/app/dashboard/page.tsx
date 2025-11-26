'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import Header from '@/components/Header';
import { ArrowUpRight } from 'lucide-react';
import SendModal from '@/components/SendModal';
import ReceiveModal from '@/components/ReceiveModal';

interface WalletTransaction {
  id?: string;
  type: string;
  amount: number;
  status: string;
  hash: string;
  description?: string;
  created_at?: string;
  recipient_address?: string;
  sender_address?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [xrdBalance, setXrdBalance] = useState(0);
  const [address, setAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([fetchBalance(), fetchTransactions()]).finally(() => setLoading(false));
  }, [router]);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wallet/balance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance || 0);
        setXrdBalance(data.xrdBalance || 0);
        setAddress(data.address || null);
      }
    } catch (e) {
      console.error('Error fetching wallet balance:', e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wallet/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error('Error fetching wallet transactions:', e);
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-6 p-3 flex items-start justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <Header title="Dashboard" showBack={false} />

        {/* Wallet balance + send */}
        <GlassCard className="space-y-3 min-h-[220px]">
          <div className="text-center mb-2">
            <p className="text-white/60 text-xs mb-1">Total USDC Balance</p>
            <div className="text-3xl font-bold mb-1">${balance.toFixed(2)}</div>
            <p className="text-white/50 text-xs">
              XRD for gas:{' '}
              <span className="font-semibold">{xrdBalance.toFixed(4)} XRD</span>
            </p>
          </div>

          {address && (
            <div className="glass-card bg-white/5 p-3 rounded-xl text-xs text-white/70 break-all">
              <p className="mb-1 text-[10px] uppercase tracking-wide text-white/40">
                Radix Wallet
              </p>
              <p className="font-mono text-[11px]">{address}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <GlassButton
              variant="primary"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => setSendOpen(true)}
            >
              <ArrowUpRight size={16} />
              <span className="text-sm">Send</span>
            </GlassButton>
            <GlassButton
              variant="secondary"
              className="flex-1 flex items-center justify-center gap-2 text-sm"
              onClick={() => setReceiveOpen(true)}
            >
              Receive
            </GlassButton>
          </div>
        </GlassCard>

        {/* Wallet transactions list */}
        <GlassCard className="min-h-[220px]">
          <h2 className="text-sm font-semibold mb-3">Wallet Activity</h2>
          {transactions.length === 0 ? (
            <p className="text-white/60 text-sm text-center py-4">No wallet transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isSend = tx.type === 'radix_send';
                return (
                  <div
                    key={tx.id || tx.hash}
                    className="flex items-center justify-between pb-3 border-b border-white/10 last:border-0"
                  >
                    <div className="flex-1 pr-3">
                      <p className="text-sm font-medium">
                        {tx.description || (isSend ? 'Sent USDC' : 'Received USDC')}
                      </p>
                      <p className="text-white/60 text-[11px]">
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleString()
                          : tx.hash.slice(0, 10) + '...'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          isSend ? 'text-red-400' : 'text-green-400'
                        }`}
                      >
                        {isSend ? '-' : '+'}${tx.amount.toFixed(2)}
                      </p>
                      <p className="text-white/60 text-[11px] capitalize">{tx.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

      </div>

      <SendModal
        isOpen={sendOpen}
        onClose={() => setSendOpen(false)}
        balance={balance}
        onSuccess={() => {
          fetchBalance();
          fetchTransactions();
        }}
      />

      {address && (
        <ReceiveModal
          isOpen={receiveOpen}
          onClose={() => setReceiveOpen(false)}
          address={address}
        />
      )}

      <BottomNav />
    </div>
  );
}

