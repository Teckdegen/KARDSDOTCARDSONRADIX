'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import GlassInput from '@/components/GlassInput';
import GlassButton from '@/components/GlassButton';
import CodeInput from '@/components/CodeInput';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendCode = async () => {
    if (!email) {
      setMessage('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setStep('code');
        setMessage('Verification code sent to your email');
      } else {
        setMessage(data.message || 'Failed to send code');
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
        body: JSON.stringify({ email, code }),
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
    <div className="min-h-screen flex items-center justify-center p-4 fade-in">
      <div className="w-full max-w-md">
        <GlassCard className="fade-in">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-6">
              <Logo size={80} className="rounded-3xl" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: '#F5F5DC' }}>Welcome back</h1>
            <p className="text-white/60 text-base md:text-lg">Sign in to continue</p>
          </div>

          {step === 'email' ? (
            <div className="space-y-6">
              <div>
                <label className="text-white/70 text-base md:text-lg mb-3 block font-medium flex items-center gap-2">
                  <Mail size={18} className="md:w-5 md:h-5" />
                  Email address
                </label>
                <GlassInput
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <GlassButton
                onClick={handleSendCode}
                disabled={loading}
                variant="primary"
                className="w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Sending...' : (
                  <>
                    Send Code <ArrowRight size={18} className="md:w-5 md:h-5" />
                  </>
                )}
              </GlassButton>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-white/70 text-base md:text-lg mb-4 block font-medium flex items-center gap-2 justify-center">
                  <Lock size={18} className="md:w-5 md:h-5" />
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
                <p className="text-white/40 text-sm md:text-base text-center mt-4">Enter the 6-digit code sent to your email</p>
              </div>
              <GlassButton
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                variant="primary"
                className="w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Verifying...' : (
                  <>
                    Verify Code <ArrowRight size={18} className="md:w-5 md:h-5" />
                  </>
                )}
              </GlassButton>
              <button
                onClick={() => {
                  setStep('email');
                  setCode('');
                }}
                className="text-white/60 text-sm hover:text-white/80 transition-all duration-300 w-full text-center"
              >
                Back to email
              </button>
            </div>
          )}

          {message && (
            <div className={`mt-5 glass-card p-3 ${
              message.includes('error') || message.includes('Failed') || message.includes('Invalid') 
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-green-500/10 border-green-500/30'
            }`}>
              <p className={`text-sm text-center ${
                message.includes('error') || message.includes('Failed') || message.includes('Invalid')
                  ? 'text-red-400' 
                  : 'text-green-400'
              }`}>
                {message}
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/register" className="text-white/60 text-sm hover:text-white/80 transition-all duration-300 inline-flex items-center gap-2 group">
              Don't have an account? <span className="text-[#F5F5DC] group-hover:underline">Sign up</span>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
