'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import GlassInput from '@/components/GlassInput';
import GlassButton from '@/components/GlassButton';
import CodeInput from '@/components/CodeInput';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, RefreshCw } from 'lucide-react';
import Notification from '@/components/Notification';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [codeSentAt, setCodeSentAt] = useState<Date | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoResendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdown = (seconds: number) => {
    setResendCountdown(seconds);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    countdownIntervalRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!email) {
      setNotification({ message: 'Please enter your email', type: 'error' });
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
        setCodeSentAt(new Date());
        startCountdown(600); // 10 minutes = 600 seconds
        setNotification({ message: 'Code sent! Check your email', type: 'success' });

        // Auto-resend after 10 minutes
        if (autoResendTimeoutRef.current) {
          clearTimeout(autoResendTimeoutRef.current);
        }
        autoResendTimeoutRef.current = setTimeout(() => {
          handleResendCode(true);
        }, 600000); // 10 minutes
      } else {
        setNotification({ message: data.message || 'Failed to send code', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async (isAutoResend = false) => {
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setCodeSentAt(new Date());
        startCountdown(600); // Reset countdown to 10 minutes
        setNotification({
          message: isAutoResend ? 'Code automatically resent! Check your email' : 'New code sent! Check your email',
          type: 'success'
        });

        // Schedule next auto-resend
        if (autoResendTimeoutRef.current) {
          clearTimeout(autoResendTimeoutRef.current);
        }
        autoResendTimeoutRef.current = setTimeout(() => {
          handleResendCode(true);
        }, 600000); // 10 minutes
      } else {
        if (data.remainingSeconds) {
          startCountdown(data.remainingSeconds);
        }
        setNotification({ message: data.message || 'Failed to resend code', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (autoResendTimeoutRef.current) {
        clearTimeout(autoResendTimeoutRef.current);
      }
    };
  }, []);

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setNotification({ message: 'Please enter a valid 6-digit code', type: 'error' });
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
        setNotification({ message: data.message || 'Invalid code', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 fade-in fixed inset-0">
      {/* 
         MoonPay Style Centered Widget 
         - Constrained width
         - Clean spacing
      */}
      <div className="w-full max-w-[440px] relative z-20">
        <GlassCard className="fade-in !p-8 md:!p-10 !border-[#F5F5DC]/10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6 shadow-2xl rounded-3xl">
              <Logo size={80} className="rounded-3xl" />
            </div>
            <h1 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: '#F5F5DC' }}>Welcome back</h1>
            <p className="text-white/40 text-sm font-medium">Sign in to manage your cards</p>
          </div>

          {step === 'email' ? (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#F5F5DC]/70 mb-2 block ml-1">
                  Email Address
                </label>
                <GlassInput
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="!bg-black/20 !border-white/10 focus:!border-[#F5F5DC]/50 !text-lg"
                />
              </div>
              <div className="pt-6">
                <GlassButton
                  onClick={handleSendCode}
                  disabled={loading}
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2 !py-4 !text-[15px] !font-bold hover:!transform-none hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  {loading ? 'Sending Code...' : 'Continue'}
                </GlassButton>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#F5F5DC]/70 mb-4 block">
                  Enter Verification Code
                </label>
                <div className="flex justify-center my-6">
                  <CodeInput
                    length={6}
                    value={code}
                    onChange={(newCode) => setCode(newCode)}
                    onComplete={(completeCode) => {
                      setCode(completeCode);
                      handleVerifyCode();
                    }}
                  />
                </div>
                <p className="text-white/30 text-xs mt-4">
                  We sent a 6-digit code to <span className="text-white/60">{email}</span>
                </p>
              </div>

              <div className="pt-4">
                <GlassButton
                  onClick={handleVerifyCode}
                  disabled={loading || code.length !== 6}
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2 !py-4 !text-[15px] !font-bold"
                >
                  {loading ? 'Verifying...' : 'Sign In'}
                </GlassButton>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  onClick={() => handleResendCode(false)}
                  disabled={loading || resendCountdown > 0}
                  className="text-white/40 text-xs font-medium hover:text-white/80 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={resendCountdown > 0 ? 'animate-spin' : ''} />
                  {resendCountdown > 0
                    ? `Resend available in ${Math.floor(resendCountdown / 60)}:${String(resendCountdown % 60).padStart(2, '0')}`
                    : 'Resend code'
                  }
                </button>
                <button
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setResendCountdown(0);
                    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                    if (autoResendTimeoutRef.current) clearTimeout(autoResendTimeoutRef.current);
                  }}
                  className="text-white/40 text-xs font-medium hover:text-white/80 transition-all duration-200"
                >
                  Change email address
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link href="/register" className="text-white/40 text-xs font-medium hover:text-white/60 transition-all duration-200">
              Don't have an account? <span className="text-[#F5F5DC] ml-1">Sign up</span>
            </Link>
          </div>
        </GlassCard>
      </div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
