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
      <div className="w-full max-w-[440px] mx-auto space-y-6">
        <Header title="Wallet" centered />

        {/* Wallet Balance Card */}
        <div className="relative overflow-hidden rounded-[32px] p-6 bg-gradient-to-bl from-[#0A0E27] to-black border border-white/10 shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#F5F5DC]/10 to-transparent rounded-bl-full -mr-12 -mt-12 pointer-events-none" />

          <div className="text-center relative z-10 mb-8">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Total Balance</p>
            <h1 className="text-4xl font-bold text-white tracking-tight">${balance.toFixed(2)}</h1>
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
              <span className="text-white/60 text-[10px] font-mono">Gas: {xrdBalance.toFixed(2)} XRD</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            <button onClick={() => setSendOpen(true)} className="group">
              <div className="bg-[#F5F5DC] rounded-2xl p-4 flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[#F5F5DC]/10">
                <ArrowUpRight size={20} className="text-[#0A0E27]" />
                <span className="text-[#0A0E27] font-bold text-sm">Send</span>
              </div>
            </button>
            <button onClick={() => setReceiveOpen(true)} className="group">
              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-center gap-2 hover:bg-white/20 transition-all active:scale-95">
                <Download size={20} className="text-white" />
                <span className="text-white font-bold text-sm">Receive</span>
              </div>
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-[#0F142D]/50 border border-white/5 rounded-[32px] p-6 min-h-[400px]">
          <h2 className="text-base font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                  <ArrowUpRight size={20} className="text-white/20" />
                </div>
                <p className="text-white/40 text-sm font-medium">No activity yet</p>
              </div>
            ) : (
              transactions.map((tx) => {
                const isSend = tx.type === 'radix_send';
                return (
                  <div
                    key={tx.id || tx.hash}
                    className="flex items-center justify-between group cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border border-white/5 ${isSend ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                        {isSend ? <ArrowUpRight size={18} className="text-red-400" /> : <Download size={18} className="text-green-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white mb-0.5">
                          {tx.description || (isSend ? 'Sent USDC' : 'Received USDC')}
                        </p>
                        <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">
                          {tx.created_at
                            ? new Date(tx.created_at).toLocaleDateString()
                            : 'Unknown Date'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${isSend ? 'text-white' : 'text-green-400'
                          }`}
                      >
                        {isSend ? '-' : '+'}${tx.amount.toFixed(2)}
                      </p>
                      <p className="text-white/30 text-[10px] font-medium capitalize">{tx.status}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
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