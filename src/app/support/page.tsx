'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassInput from '@/components/GlassInput';
import GlassButton from '@/components/GlassButton';
import Header from '@/components/Header';
import { HelpCircle, Mail } from 'lucide-react';

export default function SupportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(data.message || 'Message sent successfully! We will respond via email.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setMessage(data.message || 'Failed to send message');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <Header title="Support" centered />

        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle size={32} style={{ color: '#F5F5DC' }} />
            <div>
              <h2 className="text-lg font-semibold">Contact Us</h2>
              <p className="text-white/60 text-sm">We'll respond via email</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <GlassInput
              type="email"
              placeholder="Your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <GlassInput
              placeholder="Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
            <textarea
              placeholder="Your message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="glass-input w-full min-h-[120px] resize-none"
              required
            />
            <GlassButton
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
            >
              <Mail size={20} />
              {loading ? 'Sending...' : 'Send Message'}
            </GlassButton>
          </form>

          {message && (
            <p className={`mt-4 text-sm text-center ${
              message.includes('successfully') ? 'text-green-400' : 'text-red-400'
            }`}>
              {message}
            </p>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-1">How do I create a card?</p>
              <p className="text-white/60 text-sm">
                Go to Cards → Create New Card, fill in the required information, and pay $25 ($10 insurance + $15 to card).
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">What's the minimum top-up amount?</p>
              <p className="text-white/60 text-sm">
                The minimum top-up amount is $6 USDC. A $2.5 processing fee applies.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">How do referrals work?</p>
              <p className="text-white/60 text-sm">
                Share your referral code. You earn $0.5 for each card created with your code. Claim earnings weekly.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">How many cards can I have?</p>
              <p className="text-white/60 text-sm">
                You can have up to 4 cards per account.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <BottomNav />
    </div>
  );
}

