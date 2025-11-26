'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import SendModal from '@/components/SendModal';
import ReceiveModal from '@/components/ReceiveModal';
import Header from '@/components/Header';
import { Wallet, Send, QrCode, ArrowUpRight, ArrowDownRight, Gift } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  recipient_address?: string;
  sender_address?: string;
  description: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [cashback, setCashback] = useState<{ available: number; totalEarned: number } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchWalletData();
  }, [router]);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [balanceRes, addressRes, transactionsRes, cashbackRes] = await Promise.all([
        fetch('/api/wallet/balance', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/wallet/address', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/wallet/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/cashback', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const balanceData = await balanceRes.json();
      const addressData = await addressRes.json();
      const transactionsData = await transactionsRes.json();
      const cashbackData = await cashbackRes.json();

      if (balanceData.success) setBalance(balanceData.balance);
      if (addressData.success) setAddress(addressData.address);
      if (transactionsData.success) setTransactions(transactionsData.transactions || []);
      if (cashbackData.success) setCashback(cashbackData.cashback);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen pb-20 p-3 fade-in flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <Header title="KARDS" centered />

        <GlassCard className="fade-in">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#F5F5DC]/10 mb-3">
              <Wallet size={20} style={{ color: '#F5F5DC' }} />
            </div>
            <p className="text-white/60 text-xs mb-1.5 font-medium">Balance</p>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#F5F5DC] to-[#E8E8D3] bg-clip-text text-transparent">
              {balance !== null ? `${balance.toFixed(2)}` : '0.00'}
            </h2>
            <p className="text-white/40 text-xs">USDC</p>
          </div>
        </GlassCard>

        {cashback && cashback.available > 0 && (
          <GlassCard 
            className="fade-in cursor-pointer group border-2 border-[#F5F5DC]/30 hover:border-[#F5F5DC]/50 transition-all"
            onClick={() => router.push('/referrals')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#F5F5DC]/10 group-hover:bg-[#F5F5DC]/20 transition-colors">
                  <Gift size={18} style={{ color: '#F5F5DC' }} />
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-0.5">Cashback Available</p>
                  <p className="text-base font-bold" style={{ color: '#F5F5DC' }}>
                    ${cashback.available.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-xs mb-0.5">Total Earned</p>
                <p className="text-xs font-semibold text-white/70">
                  ${cashback.totalEarned.toFixed(2)}
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-2 gap-2 fade-in">
          <GlassCard 
            className="text-center cursor-pointer group p-2"
            onClick={() => setShowSendModal(true)}
          >
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 mb-1.5 group-hover:bg-red-500/20 transition-colors">
              <Send size={14} className="text-red-400" />
            </div>
            <p className="text-xs font-medium">Send</p>
          </GlassCard>
          <GlassCard 
            className="text-center cursor-pointer group p-2"
            onClick={() => setShowReceiveModal(true)}
          >
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 mb-1.5 group-hover:bg-green-500/20 transition-colors">
              <QrCode size={14} className="text-green-400" />
            </div>
            <p className="text-xs font-medium">Receive</p>
          </GlassCard>
        </div>

        <GlassCard className="fade-in p-2">
          <p className="text-white/70 text-xs mb-1.5 font-medium">Wallet Address</p>
          <div className="glass-card bg-white/5 p-1.5 rounded-lg">
            <p className="text-xs break-all font-mono text-white/80 leading-tight">{address}</p>
          </div>
        </GlassCard>

        <GlassCard className="fade-in">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <div className="w-0.5 h-4 bg-[#F5F5DC] rounded-full" />
            Recent Transactions
          </h3>
          {transactions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-white/40 text-xs">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 10).map((tx, index) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between pb-2 border-b border-white/10 last:border-0 slide-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === 'radix_send' ? 'bg-red-500/10' : 'bg-green-500/10'
                    }`}>
                      {tx.type === 'radix_send' ? (
                        <ArrowUpRight size={14} className="text-red-400" />
                      ) : (
                        <ArrowDownRight size={14} className="text-green-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{tx.description || tx.type}</p>
                      <p className="text-white/50 text-xs">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-xs ${
                      tx.type === 'radix_send' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {tx.type === 'radix_send' ? '-' : '+'}{tx.amount.toFixed(2)} USDC
                    </p>
                    <p className="text-white/50 text-xs capitalize">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <SendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        balance={balance || 0}
        onSuccess={fetchWalletData}
      />

      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        address={address}
      />

      <BottomNav />
    </div>
  );
}
