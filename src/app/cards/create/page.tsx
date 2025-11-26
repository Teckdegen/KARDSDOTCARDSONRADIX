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
    phoneCode: '+1',
    phoneNumber: '',
    dateOfBirth: '',
    homeAddressNumber: '',
    homeAddress: '',
    cardName: '',
    cardType: 'virtual',
    cardBrand: 'Visa',
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
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen pb-20 p-3 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <Header title="Create Card" showBack backUrl="/cards" />

        <div className="step-indicator">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`step-dot ${step === i ? 'active' : ''}`}
            />
          ))}
        </div>

        <form onSubmit={handleCreateCard}>
          <GlassCard className="glass-card-reduced p-6 step-form-container">
            {/* Step 1: Phone and Date of Birth */}
            {step === 1 && (
              <div className="step-form-content">
                <h2 className="text-xl font-bold mb-6 text-center">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Phone Code</label>
                    <select
                      value={formData.phoneCode}
                      onChange={(e) => updateFormData('phoneCode', e.target.value)}
                      className="glass-input w-full"
                      required
                    >
                      <option value="+1">+1 (US/Canada)</option>
                      <option value="+234">+234 (Nigeria)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+237">+237 (Cameroon)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Phone Number</label>
                    <GlassInput
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phoneNumber}
                      onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Date of Birth</label>
                    <GlassInput
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Information */}
            {step === 2 && (
              <div className="step-form-content">
                <h2 className="text-xl font-bold mb-6 text-center">Address Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Address Number</label>
                    <GlassInput
                      placeholder="e.g., 12B, Apt 5"
                      value={formData.homeAddressNumber}
                      onChange={(e) => updateFormData('homeAddressNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Full Address</label>
                    <GlassInput
                      placeholder="Street, City, Country"
                      value={formData.homeAddress}
                      onChange={(e) => updateFormData('homeAddress', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Card Details */}
            {step === 3 && (
              <div className="step-form-content">
                <h2 className="text-xl font-bold mb-6 text-center">Card Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Card Name</label>
                    <GlassInput
                      placeholder="Name on card"
                      value={formData.cardName}
                      onChange={(e) => updateFormData('cardName', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Card Type</label>
                    <select
                      value={formData.cardType}
                      onChange={(e) => updateFormData('cardType', e.target.value)}
                      className="glass-input w-full"
                      required
                    >
                      <option value="virtual">Virtual</option>
                      <option value="physical">Physical</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Card Brand</label>
                    <select
                      value={formData.cardBrand}
                      onChange={(e) => updateFormData('cardBrand', e.target.value)}
                      className="glass-input w-full"
                      required
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Referral Code (Optional)</label>
                    <GlassInput
                      placeholder="Enter referral code"
                      value={formData.referralCode}
                      onChange={(e) => updateFormData('referralCode', e.target.value.toLowerCase())}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Payment and Confirmation */}
            {step === 4 && (
              <div className="step-form-content">
                <h2 className="text-xl font-bold mb-6 text-center">Payment Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Initial Amount (Minimum $15)</label>
                    <GlassInput
                      type="number"
                      placeholder="15"
                      value={formData.initialAmount}
                      onChange={(e) => updateFormData('initialAmount', e.target.value)}
                      min="15"
                      step="0.01"
                      required
                    />
                  </div>

                  <GlassCard className="bg-white/5 border-white/10">
                    <h3 className="text-sm font-semibold mb-3">Payment Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Insurance Fee</span>
                        <span>$10.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Card Balance</span>
                        <span>${parseFloat(formData.initialAmount || '15').toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/10 font-semibold">
                        <span>Total</span>
                        <span>${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </GlassCard>

                  {message && (
                    <p
                      className={`text-sm text-center ${
                        message.includes('error') || message.includes('Failed')
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="step-form-actions">
              {step > 1 && (
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={prevStep}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Back
                </GlassButton>
              )}

              {step < 4 ? (
                <GlassButton
                  type="button"
                  variant="primary"
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={16} />
                </GlassButton>
              ) : (
                <GlassButton
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  className="w-full"
                >
                  {loading ? 'Creating Card...' : 'Create Card'}
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