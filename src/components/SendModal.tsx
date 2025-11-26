'use client';

import { useState } from 'react';
import GlassCard from './GlassCard';
import GlassInput from './GlassInput';
import GlassButton from './GlassButton';
import { X, Send, ArrowRight } from 'lucide-react';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onSuccess: () => void;
}

export default function SendModal({ isOpen, onClose, balance, onSuccess }: SendModalProps) {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientAddress || !amount) {
      setMessage('Please enter recipient address and amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0 || amountNum > balance) {
      setMessage('Invalid amount');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientAddress,
          amount: amountNum,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Transaction sent successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
          setRecipientAddress('');
          setAmount('');
          setMessage('');
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to send transaction');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <GlassCard
        className="w-full max-w-lg h-full max-h-[520px] relative fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-all duration-300 hover:rotate-90"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#F5F5DC]/10 mb-3">
            <Send size={24} style={{ color: '#F5F5DC' }} />
          </div>
          <h2 className="text-base font-bold mb-1">Send USDC</h2>
          <p className="text-white/60 text-xs">Available: <span className="text-[#F5F5DC] font-semibold">{balance.toFixed(2)} USDC</span></p>
        </div>

        <form onSubmit={handleSend} className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-xs mb-1.5 block font-medium">
                Recipient Address
              </label>
              <GlassInput
                placeholder="account_rdx..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-white/70 text-xs mb-1.5 block font-medium">
                Amount (USDC)
              </label>
              <GlassInput
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                max={balance.toString()}
                required
              />
            </div>

            {message && (
              <div
                className={`glass-card p-3 ${
                  message.includes('successfully')
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <p
                  className={`text-sm text-center ${
                    message.includes('successfully') ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {message}
                </p>
              </div>
            )}
          </div>

          <GlassButton
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>Sending...</>
            ) : (
              <>
                Send <ArrowRight size={14} />
              </>
            )}
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}
