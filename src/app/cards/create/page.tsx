'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassInput from '@/components/GlassInput';
import GlassButton from '@/components/GlassButton';
import { ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function CreateCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen pb-20 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4 pt-8">
          <Link href="/cards">
            <ArrowLeft size={24} className="text-white/60 hover:text-white transition" />
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: '#F5F5DC' }}>Create Card</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <GlassCard className="space-y-4">
            <div>
              <label className="text-white/60 text-sm mb-2 block">Phone Code</label>
              <select
                value={formData.phoneCode}
                onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Date of Birth</label>
              <GlassInput
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Address Number</label>
              <GlassInput
                placeholder="e.g., 12B, Apt 5"
                value={formData.homeAddressNumber}
                onChange={(e) => setFormData({ ...formData, homeAddressNumber: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Full Address</label>
              <GlassInput
                placeholder="Street, City, Country"
                value={formData.homeAddress}
                onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Card Name</label>
              <GlassInput
                placeholder="Name on card"
                value={formData.cardName}
                onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Card Type</label>
              <select
                value={formData.cardType}
                onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, cardBrand: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toLowerCase() })}
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Initial Amount (Minimum $15)</label>
              <GlassInput
                type="number"
                placeholder="15"
                value={formData.initialAmount}
                onChange={(e) => setFormData({ ...formData, initialAmount: e.target.value })}
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
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? 'Creating Card...' : 'Create Card'}
            </GlassButton>
          </GlassCard>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}

