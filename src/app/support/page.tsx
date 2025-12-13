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
      <div className="w-full max-w-[440px] mx-auto space-y-6">
        <Header title="Support" centered />

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
              <HelpCircle size={32} className="text-[#F5F5DC]" />
            </div>
            <h2 className="text-xl font-bold text-white">How can we help?</h2>
            <p className="text-white/40 text-xs">Send us a message and we'll reply via email</p>
          </div>

          <GlassCard className="!p-6 !gap-4 bg-[#0F142D]/50 border border-white/5 !rounded-[32px]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1.5 block ml-1">Your Name</label>
                <GlassInput
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1.5 block ml-1">Email Address</label>
                <GlassInput
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1.5 block ml-1">Subject</label>
                <GlassInput
                  placeholder="e.g. Transaction Issue"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1.5 block ml-1">Message</label>
                <textarea
                  placeholder="Describe your issue detailed..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white text-base placeholder-white/20 focus:outline-none focus:border-[#F5F5DC]/50 transition-colors min-h-[120px] resize-none"
                  required
                />
              </div>

              <GlassButton
                type="submit"
                disabled={loading}
                variant="primary"
                className="w-full flex items-center justify-center gap-2 !py-4 !text-base !font-bold mt-2"
              >
                <Mail size={18} />
                {loading ? 'Sending...' : 'Send Message'}
              </GlassButton>
            </form>
          </GlassCard>

          {message && (
            <div className={`p-4 rounded-2xl text-center text-sm font-medium ${message.includes('successfully')
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}