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
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl">
        <GlassCard className="fade-in">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-6">
              <Logo size={100} className="rounded-3xl" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-2" style={{ color: 'rgba(245, 245, 220, 0.6)' }}>Welcome back</h1>
            <p className="text-white/40 text-sm md:text-base">Sign in to continue</p>
          </div>

          {step === 'email' ? (
            <div className="space-y-6">
              <div>
                <label className="text-white/50 text-sm md:text-base mb-2 block font-medium flex items-center gap-2">
                  <Mail size={16} className="md:w-4 md:h-4 opacity-60" />
                  Email address
                </label>
                <GlassInput
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="pt-14">
                <GlassButton
                  onClick={handleSendCode}
                  disabled={loading}
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending...' : (
                    <>
                      Send Code <ArrowRight size={18} className="md:w-5 md:h-5" />
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
              <div className="pt-14">
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
              <div className="pt-4 space-y-2">
                <button
                  onClick={() => handleResendCode(false)}
                  disabled={loading || resendCountdown > 0}
                  className="text-white/60 text-sm hover:text-white/80 transition-all duration-300 w-full text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={14} className={resendCountdown > 0 ? 'animate-spin' : ''} />
                  {resendCountdown > 0 
                    ? `Resend code in ${Math.floor(resendCountdown / 60)}:${String(resendCountdown % 60).padStart(2, '0')}`
                    : 'Resend Code'
                  }
                </button>
                <button
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setResendCountdown(0);
                    if (countdownIntervalRef.current) {
                      clearInterval(countdownIntervalRef.current);
                    }
                    if (autoResendTimeoutRef.current) {
                      clearTimeout(autoResendTimeoutRef.current);
                    }
                  }}
                  className="text-white/60 text-sm hover:text-white/80 transition-all duration-300 w-full text-center"
                >
                  Back to email
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/register" className="text-white/40 text-xs md:text-sm hover:text-white/60 transition-all duration-300 inline-flex items-center gap-2 group">
              Don't have an account? <span className="text-[rgba(245,245,220,0.5)] group-hover:text-[rgba(245,245,220,0.7)] group-hover:underline">Sign up</span>
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
