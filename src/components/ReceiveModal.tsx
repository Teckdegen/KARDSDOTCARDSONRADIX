'use client';

import { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import { X, QrCode, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export default function ReceiveModal({ isOpen, onClose, address }: ReceiveModalProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && address) {
      QRCode.toDataURL(address, {
        width: 280,
        margin: 2,
        color: {
          dark: '#F5F5DC',
          light: '#0A0E27',
        },
      }).then(setQrCode);
    }
  }, [isOpen, address]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <GlassCard 
        className="w-full max-w-md relative fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/60 hover:text-white transition-all duration-300 hover:rotate-90"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F5F5DC]/10 mb-4">
            <QrCode size={32} style={{ color: '#F5F5DC' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Receive Radix</h2>
          <p className="text-white/60 text-sm">Share this address to receive funds</p>
        </div>

        {qrCode && (
          <div className="flex justify-center mb-6">
            <div className="glass-card p-6 rounded-3xl">
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            </div>
          </div>
        )}

        <GlassCard className="bg-white/5 mb-4">
          <p className="text-white/70 text-xs mb-3 font-medium">Wallet Address</p>
          <p className="text-xs break-all font-mono mb-4 leading-relaxed text-white/80">{address}</p>
          <GlassButton
            variant="secondary"
            onClick={copyAddress}
            className="w-full flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Address
              </>
            )}
          </GlassButton>
        </GlassCard>
      </GlassCard>
    </div>
  );
}
