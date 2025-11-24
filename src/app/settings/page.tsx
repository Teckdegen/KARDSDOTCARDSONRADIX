'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import LogoutModal from '@/components/LogoutModal';
import Logo from '@/components/Logo';
import { Settings as SettingsIcon, Power, User } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user profile (you'll need to create this API endpoint)
    // For now, we'll just show the settings page
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-center gap-3 pt-8">
          <Logo size={28} className="rounded-xl" />
          <h1 className="text-2xl font-bold" style={{ color: '#F5F5DC' }}>Settings</h1>
        </div>

        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <User size={32} style={{ color: '#F5F5DC' }} />
            <div>
              <h2 className="text-lg font-semibold">Profile</h2>
              <p className="text-white/60 text-sm">Account information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-white/60 text-sm mb-1">Email</p>
              <p className="font-medium">{user?.email || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Account Created</p>
              <p className="font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon size={24} style={{ color: '#F5F5DC' }} />
            <h2 className="text-lg font-semibold">Preferences</h2>
          </div>
          <p className="text-white/60 text-sm">Settings coming soon...</p>
        </GlassCard>

        <GlassButton
          variant="secondary"
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-center gap-2 text-red-400 border-red-400/30 hover:bg-red-400/10"
        >
          <Power size={20} />
          Sign Out
        </GlassButton>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      <BottomNav />
    </div>
  );
}

