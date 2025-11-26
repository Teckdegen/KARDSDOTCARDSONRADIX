'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import LogoutModal from '@/components/LogoutModal';
import Header from '@/components/Header';
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

    fetchUserProfile();
  }, [router]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen pb-20 p-3 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <Header title="Settings" centered />

        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <User size={20} style={{ color: '#F5F5DC' }} />
            <div>
              <h2 className="text-sm font-semibold">Profile</h2>
              <p className="text-white/60 text-xs">Account information</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-white/60 text-xs mb-1">Name</p>
              <p className="text-sm font-medium">{user?.fullName || user?.firstName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">Email</p>
              <p className="text-sm font-medium">{user?.email || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">Account Created</p>
              <p className="text-sm font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <SettingsIcon size={16} style={{ color: '#F5F5DC' }} />
            <h2 className="text-sm font-semibold">Preferences</h2>
          </div>
          <p className="text-white/60 text-xs">Settings coming soon...</p>
        </GlassCard>

        <GlassButton
          variant="secondary"
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-center gap-2 text-red-400 border-red-400/30 hover:bg-red-400/10"
        >
          <Power size={16} />
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

