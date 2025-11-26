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
    <div className="min-h-screen pb-20 p-3 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Header title="Support" centered />

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle size={24} style={{ color: '#F5F5DC' }} />
            <div>
              <h2 className="text-xl font-bold">Contact Us</h2>
              <p className="text-white/60 text-sm">We'll respond via email</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
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
              className="glass-input w-full min-h-[160px] resize-none text-base"
              required
            />
            <GlassButton
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full flex items-center justify-center gap-2 py-3 text-lg"
            >
              <Mail size={20} />
              {loading ? 'Sending...' : 'Send Message'}
            </GlassButton>
          </form>

          {message && (
            <p className={`mt-6 text-center text-lg ${
              message.includes('successfully') ? 'text-green-400' : 'text-red-400'
            }`}>
              {message}
            </p>
          )}
        </GlassCard>
      </div>

      <BottomNav />
    </div>
  );
}