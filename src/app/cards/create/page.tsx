'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassInput from '@/components/GlassInput';
import GlassButton from '@/components/GlassButton';
import Header from '@/components/Header';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CreateCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cardName: '',
    referralCode: '',
    initialAmount: '15',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cards/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          initialAmount: parseFloat(formData.initialAmount),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Card creation initiated! Processing...');
        setTimeout(() => {
          router.push('/cards');
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to create card');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = 25; // $10 insurance + $15 to card

  const nextStep = () => {
    if (step < 2) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen pb-20 p-3 flex items-center justify-center">
      <div className="w-full max-w-[440px] mx-auto space-y-6">
        <Header title={step === 1 ? "Customize Card" : "Payment"} showBack backUrl="/cards" centered />

        <form onSubmit={handleCreateCard}>
          <GlassCard className="!p-0 !overflow-visible !bg-transparent !border-0 !shadow-none">
            {/* Steps Progress */}
            <div className="flex justify-center mb-8 gap-2">
              {[1, 2].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#F5F5DC]' : 'w-2 bg-white/10'}`} />
              ))}
            </div>

            <div className="bg-[#0F142D]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
              {/* Step 1: Card Details */}
              {step === 1 && (
                <div className="step-form-content space-y-6 fade-in">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-[#F5F5DC] to-white/90 rounded-2xl shadow-lg shadow-[#F5F5DC]/20 flex items-center justify-center mb-4 transform rotate-3">
                      <CreditCard size={32} className="text-[#0A0E27]" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">Name your Card</h2>
                    <p className="text-white/40 text-xs">Give your new card a nickname</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#F5F5DC]/70 mb-2 block ml-1">Card Nickname</label>
                      <GlassInput
                        placeholder="e.g. Shopping, Travel..."
                        value={formData.cardName}
                        onChange={(e) => updateFormData('cardName', e.target.value)}
                        required
                        className="!bg-black/20 !border-white/10 focus:!border-[#F5F5DC]/50 !text-lg !py-4"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#F5F5DC]/70 mb-2 block ml-1">Referral Code <span className="text-white/20 normal-case tracking-normal">(Optional)</span></label>
                      <GlassInput
                        placeholder="Enter code"
                        value={formData.referralCode}
                        onChange={(e) => updateFormData('referralCode', e.target.value.toLowerCase())}
                        className="!bg-black/20 !border-white/10 focus:!border-[#F5F5DC]/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <div className="step-form-content space-y-6 fade-in">
                  <div className="text-center">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Initial Top Up</p>
                    <div className="relative inline-block">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#F5F5DC]">$</span>
                      <input
                        type="number"
                        value={formData.initialAmount}
                        onChange={(e) => updateFormData('initialAmount', e.target.value)}
                        min="15"
                        step="0.01"
                        className="bg-transparent border-none text-5xl font-bold text-white w-40 text-center focus:outline-none focus:ring-0 placeholder-white/20"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-white/30 text-xs mt-1">Minimum $15.00 required</p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 space-y-3 border border-white/5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Breakdown</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Insurance Fee</span>
                      <span className="text-white font-medium">$10.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Card Balance</span>
                      <span className="text-white font-medium">${parseFloat(formData.initialAmount || '0').toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-white/10 my-1" />
                    <div className="flex justify-between font-bold text-base">
                      <span className="text-[#F5F5DC]">Total to Pay</span>
                      <span className="text-white">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {message && (
                    <p className={`text-xs text-center font-medium ${message.includes('error') ? 'text-red-400' : 'text-green-400'}`}>
                      {message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              {step < 2 ? (
                <GlassButton
                  type="button"
                  variant="primary"
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 !py-4 !text-base !font-bold hover:!transform-none hover:brightness-110"
                >
                  Continue
                  <ChevronRight size={18} />
                </GlassButton>
              ) : (
                <GlassButton
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  className="flex-1 !py-4 !text-base !font-bold hover:!transform-none hover:brightness-110"
                >
                  {loading ? 'Creating...' : `Pay $${totalAmount.toFixed(2)}`}
                </GlassButton>
              )}
            </div>
          </GlassCard>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}