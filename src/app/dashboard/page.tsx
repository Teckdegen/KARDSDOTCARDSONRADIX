'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import Header from '@/components/Header';
import { ArrowUpRight, Download } from 'lucide-react';
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

    Promise.all([fetchBalance(), fetchTransactions(), fetchAddress()]).finally(() => setLoading(false));
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
      }
    } catch (e) {
      console.error('Error fetching wallet balance:', e);
    }
  };

  const fetchAddress = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wallet/address', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAddress(data.address || null);
      }
    } catch (e) {
      console.error('Error fetching wallet address:', e);
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
    <div className="min-h-screen pb-20 pt-4 p-3 flex items-start justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Header title="Dashboard" showBack={false} />

        {/* Wallet balance + send - larger and fits screen better */}
        <GlassCard className="glass-card-reduced p-6 full-screen-card">
          <div className="flex flex-col h-full">
            <div className="text-center flex-1 flex flex-col justify-center">
              <p className="text-white/60 text-sm mb-2">Total USDC Balance</p>
              <div className="text-4xl font-bold mb-2">${balance.toFixed(2)}</div>
              <p className="text-white/50 text-sm">
                XRD for gas:{' '}
                <span className="font-semibold">{xrdBalance.toFixed(4)} XRD</span>
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <GlassButton
                variant="primary"
                className="flex-1 flex items-center justify-center gap-2 py-4"
                onClick={() => setSendOpen(true)}
              >
                <ArrowUpRight size={18} />
                <span className="text-lg">Send</span>
              </GlassButton>
              <GlassButton
                variant="secondary"
                className="flex-1 flex items-center justify-center gap-2 py-4 text-lg"
                onClick={() => setReceiveOpen(true)}
              >
                <Download size={18} />
                Receive
              </GlassButton>
            </div>
          </div>
        </GlassCard>

        {/* Wallet transactions list - extends to bottom with scroll */}
        <GlassCard className="glass-card-reduced p-6 flex-1 flex flex-col transaction-card">
          <h2 className="text-lg font-semibold mb-4">Wallet Activity</h2>
          <div className="flex-1 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/60 text-lg text-center">No wallet transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => {
                  const isSend = tx.type === 'radix_send';
                  return (
                    <div
                      key={tx.id || tx.hash}
                      className="flex items-center justify-between pb-4 border-b border-white/10 last:border-0"
                    >
                      <div className="flex-1 pr-4">
                        <p className="text-base font-medium">
                          {tx.description || (isSend ? 'Sent USDC' : 'Received USDC')}
                        </p>
                        <p className="text-white/60 text-sm">
                          {tx.created_at
                            ? new Date(tx.created_at).toLocaleString()
                            : tx.hash.slice(0, 10) + '...'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-base font-semibold ${
                            isSend ? 'text-red-400' : 'text-green-400'
                          }`}
                        >
                          {isSend ? '-' : '+'}${tx.amount.toFixed(2)}
                        </p>
                        <p className="text-white/60 text-sm capitalize">{tx.status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

      <ReceiveModal
        isOpen={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        address={address || ''}
      />

      <BottomNav />
    </div>
  );
}