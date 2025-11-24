'use client';

import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import { Power, X } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <GlassCard 
        className="w-full max-w-sm relative fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
            <Power size={40} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Sign Out</h2>
          <p className="text-white/60 text-sm mb-8">Are you sure you want to sign out?</p>
          
          <div className="space-y-3">
            <GlassButton
              onClick={onConfirm}
              variant="primary"
              className="w-full bg-red-500 hover:bg-red-600 text-white border-none"
            >
              Sign Out
            </GlassButton>
            <GlassButton
              onClick={onClose}
              variant="secondary"
              className="w-full"
            >
              Cancel
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

