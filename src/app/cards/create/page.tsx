'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassInput from '@/components/GlassInput';
import GlassButton from '@/components/GlassButton';
import Header from '@/components/Header';
import { Wallet, CheckCircle } from 'lucide-react';
import { connectRadixWallet, isRadixWalletInstalled, signAndSendTransaction } from '@/lib/radix-wallet-connector';

export default function CreateCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [insurancePaid, setInsurancePaid] = useState(false);
  const [processingStep, setProcessingStep] = useState<'connect' | 'insurance' | 'bridge' | 'complete'>('connect');
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
    
    // Check if wallet is already connected
    if (isRadixWalletInstalled()) {
      checkWalletConnection();
    }
  }, [router]);

  const checkWalletConnection = async () => {
    try {
      const { connectRadixWallet } = await import('@/lib/radix-wallet-connector');
      const wallet = await connectRadixWallet();
      setWalletAddress(wallet.address);
      setWalletConnected(true);
      setProcessingStep('insurance');
    } catch (error) {
      // Wallet not connected yet
    }
  };

  const handleConnectWallet = async () => {
    try {
      const wallet = await connectRadixWallet();
      setWalletAddress(wallet.address);
      setWalletConnected(true);
      setProcessingStep('insurance');
      setMessage('');
    } catch (error: any) {
      setMessage(error.message || 'Failed to connect wallet');
    }
  };

  const handlePayInsurance = async () => {
    if (!walletAddress) {
      setMessage('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      
      // Get insurance payment manifest
      const quoteResponse = await fetch('/api/cards/create/insurance-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ walletAddress }),
      });

      const quoteData = await quoteResponse.json();
      if (!quoteData.success) {
        setMessage(quoteData.message || 'Failed to get insurance quote');
        return;
      }

      // Sign and send insurance payment
      const txHash = await signAndSendTransaction(quoteData.manifest);
      
      // Confirm insurance payment
      const confirmResponse = await fetch('/api/cards/create/confirm-insurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          walletAddress,
          transactionHash: txHash 
        }),
      });

      const confirmData = await confirmResponse.json();
      if (confirmData.success) {
        setInsurancePaid(true);
        setProcessingStep('bridge');
        setMessage('Insurance fee paid! Now proceed with card funding.');
      } else {
        setMessage(confirmData.message || 'Failed to confirm insurance payment');
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to pay insurance fee');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletConnected || !walletAddress) {
      setMessage('Please connect your Radix wallet first');
      return;
    }

    if (!insurancePaid) {
      setMessage('Please pay the insurance fee first');
      return;
    }

    setLoading(true);
    setMessage('');
    setProcessingStep('bridge');

    try {
      const token = localStorage.getItem('token');
      
      // Get bridge quote for card funding
      const bridgeResponse = await fetch('/api/cards/create/bridge-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          initialAmount: parseFloat(formData.initialAmount),
          walletAddress,
        }),
      });

      const bridgeData = await bridgeResponse.json();
      if (!bridgeData.success) {
        setMessage(bridgeData.message || 'Failed to get bridge quote');
        return;
      }

      // Sign and send bridge transaction
      const bridgeHash = await signAndSendTransaction(bridgeData.manifest);

      // Create card with signed bridge transaction
      const response = await fetch('/api/cards/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          initialAmount: parseFloat(formData.initialAmount),
          walletAddress,
          bridgeTransactionHash: bridgeHash,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProcessingStep('complete');
        setMessage('Card creation initiated! Processing...');
        setTimeout(() => {
          router.push('/cards');
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to create card');
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = 25; // $10 insurance + $15 to card

  return (
    <div className="min-h-screen pb-20 p-3 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <Header title="Create Card" showBack backUrl="/cards" />

        {!walletConnected ? (
          <GlassCard className="space-y-4">
            <div className="text-center">
              <Wallet className="mx-auto mb-4" size={48} style={{ color: '#F5F5DC' }} />
              <h2 className="text-lg font-bold mb-2">Connect Your Radix Wallet</h2>
              <p className="text-white/60 text-sm mb-4">
                Connect your Radix wallet to create a card. You'll need to pay a $10 insurance fee and fund your card.
              </p>
              {!isRadixWalletInstalled() && (
                <p className="text-yellow-400 text-xs mb-4">
                  Please install Radix Wallet extension from{' '}
                  <a href="https://wallet.radixdlt.com/" target="_blank" rel="noopener noreferrer" className="underline">
                    wallet.radixdlt.com
                  </a>
                </p>
              )}
              <GlassButton
                type="button"
                onClick={handleConnectWallet}
                variant="primary"
                className="w-full flex items-center justify-center gap-2"
                disabled={!isRadixWalletInstalled()}
              >
                <Wallet size={16} />
                Connect Radix Wallet
              </GlassButton>
            </div>
          </GlassCard>
        ) : (
          <>
            <GlassCard className="bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-green-400" />
                <p className="text-sm font-medium">Wallet Connected</p>
              </div>
              <p className="text-xs font-mono text-white/80 break-all">{walletAddress}</p>
            </GlassCard>

            {!insurancePaid ? (
              <GlassCard className="space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-bold mb-2">Step 1: Pay Insurance Fee</h3>
                  <p className="text-white/60 text-sm mb-4">Pay $10.00 USDC insurance fee to proceed</p>
                </div>
                <GlassButton
                  type="button"
                  onClick={handlePayInsurance}
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Pay $10.00 Insurance Fee'}
                </GlassButton>
              </GlassCard>
            ) : (
              <form onSubmit={handleCreateCard}>
                <GlassCard className="space-y-4">
                  <div className="text-center mb-4">
                    <CheckCircle size={24} className="mx-auto mb-2 text-green-400" />
                    <p className="text-sm text-green-400 mb-2">Insurance Fee Paid ✓</p>
                    <h3 className="text-base font-bold">Step 2: Card Details & Funding</h3>
                  </div>
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
                    {loading ? (processingStep === 'bridge' ? 'Bridging Funds...' : 'Creating Card...') : 'Create Card & Bridge Funds'}
                  </GlassButton>
                </GlassCard>
              </form>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

