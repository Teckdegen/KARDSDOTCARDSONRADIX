'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import LogoutModal from '@/components/LogoutModal';
import Header from '@/components/Header';
import { User, Power } from 'lucide-react';

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
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Header title="Profile" centered />

        <div className="grid grid-cols-1 gap-6">
          <GlassCard className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <User size={32} style={{ color: '#F5F5DC' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.fullName || user?.firstName || 'User'}</h2>
                <p className="text-white/60">{user?.email || 'Loading...'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-white/60 text-sm mb-2">Full Name</p>
                <p className="text-lg font-medium">{user?.fullName || user?.firstName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-2">Email</p>
                <p className="text-lg font-medium">{user?.email || 'Loading...'}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-2">Account Created</p>
                <p className="text-lg font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-2">User ID</p>
                <p className="text-lg font-medium text-sm font-mono">{user?.id?.slice(0, 8) || 'N/A'}</p>
              </div>
            </div>
          </GlassCard>

          <GlassButton
            variant="secondary"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-3 py-4 text-red-400 border-red-400/30 hover:bg-red-400/10 text-lg"
          >
            <Power size={20} />
            Sign Out
          </GlassButton>
        </div>
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