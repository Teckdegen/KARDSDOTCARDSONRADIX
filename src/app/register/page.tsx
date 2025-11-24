'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import GlassInput from '@/components/GlassInput';
import GlassButton from '@/components/GlassButton';
import CodeInput from '@/components/CodeInput';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { User, Mail, Hash, Lock, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    referralCode: '',
  });
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.referralCode) {
      setMessage('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setStep('code');
        setMessage('Account created! Check your email for verification code.');
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setMessage('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code }),
      });

      const data = await response.json();
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        setMessage(data.message || 'Invalid code');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 fade-in fixed inset-0">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl">
        <GlassCard className="fade-in">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-6">
              <Logo size={80} className="rounded-3xl" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-2" style={{ color: 'rgba(245, 245, 220, 0.6)' }}>Create Account</h1>
            <p className="text-white/40 text-sm md:text-base">Join KARDS today</p>
          </div>

          {step === 'form' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-sm md:text-base mb-2 block font-medium flex items-center gap-2">
                    <User size={16} className="md:w-4 md:h-4 opacity-60" />
                    First name
                  </label>
                  <GlassInput
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-white/50 text-sm md:text-base mb-2 block font-medium">Last name</label>
                  <GlassInput
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-sm md:text-base mb-2 block font-medium flex items-center gap-2">
                  <Mail size={16} className="md:w-4 md:h-4 opacity-60" />
                  Email address
                </label>
                <GlassInput
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-white/50 text-sm md:text-base mb-2 block font-medium flex items-center gap-2">
                  <Hash size={16} className="md:w-4 md:h-4 opacity-60" />
                  Referral Code
                </label>
                <GlassInput
                  placeholder="teckdegen"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toLowerCase() })}
                />
                <p className="text-white/30 text-xs md:text-sm mt-2">Choose a unique username-style code</p>
              </div>
              <div className="pt-10">
                <GlassButton
                  onClick={handleRegister}
                  disabled={loading}
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating...' : (
                    <>
                      Create Account <ArrowRight size={18} className="md:w-5 md:h-5" />
                    </>
                  )}
                </GlassButton>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-white/50 text-sm md:text-base mb-4 block font-medium flex items-center gap-2 justify-center">
                  <Lock size={16} className="md:w-4 md:h-4 opacity-60" />
                  Verification Code
                </label>
                <CodeInput
                  length={6}
                  value={code}
                  onChange={(newCode) => setCode(newCode)}
                  onComplete={(completeCode) => {
                    setCode(completeCode);
                    handleVerifyCode();
                  }}
                />
                <p className="text-white/30 text-xs md:text-sm text-center mt-4">Enter the 6-digit code sent to your email</p>
              </div>
              <div className="pt-10">
                <GlassButton
                  onClick={handleVerifyCode}
                  disabled={loading || code.length !== 6}
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying...' : (
                    <>
                      Verify Code <ArrowRight size={18} className="md:w-5 md:h-5" />
                    </>
                  )}
                </GlassButton>
              </div>
            </div>
          )}

          {message && (
            <div className={`mt-5 glass-card p-3 ${
              message.includes('error') || message.includes('Failed') || message.includes('Invalid') || message.includes('taken') 
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-green-500/10 border-green-500/30'
            }`}>
              <p className={`text-sm text-center ${
                message.includes('error') || message.includes('Failed') || message.includes('Invalid') || message.includes('taken')
                  ? 'text-red-400' 
                  : 'text-green-400'
              }`}>
                {message}
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="text-white/40 text-xs md:text-sm hover:text-white/60 transition-all duration-300 inline-flex items-center gap-2 group">
              Already have an account? <span className="text-[rgba(245,245,220,0.5)] group-hover:text-[rgba(245,245,220,0.7)] group-hover:underline">Login</span>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
