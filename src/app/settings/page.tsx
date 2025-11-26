'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import LogoutModal from '@/components/LogoutModal';
import Header from '@/components/Header';
import { Settings as SettingsIcon, Power, User, Shield, Bell, Globe } from 'lucide-react';

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
        <Header title="Settings" centered />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <User size={24} style={{ color: '#F5F5DC' }} />
                <div>
                  <h2 className="text-xl font-bold">Profile</h2>
                  <p className="text-white/60 text-sm">Account information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield size={24} style={{ color: '#F5F5DC' }} />
                <div>
                  <h2 className="text-xl font-bold">Security</h2>
                  <p className="text-white/60 text-sm">Manage your security settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-white/60 text-sm">Add an extra layer of security</p>
                  </div>
                  <div className="w-12 h-6 bg-white/10 rounded-full relative">
                    <div className="w-5 h-5 bg-white/60 rounded-full absolute top-0.5 left-0.5"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-medium">Login History</p>
                    <p className="text-white/60 text-sm">View your recent login activity</p>
                  </div>
                  <div className="text-white/60">→</div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <SettingsIcon size={24} style={{ color: '#F5F5DC' }} />
                <div>
                  <h2 className="text-xl font-bold">Preferences</h2>
                  <p className="text-white/60 text-sm">Customize your experience</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell size={18} style={{ color: '#F5F5DC' }} />
                    <div>
                      <p className="font-medium">Notifications</p>
                      <p className="text-white/60 text-sm">Email alerts</p>
                    </div>
                  </div>
                  <div className="w-10 h-5 bg-white/10 rounded-full relative">
                    <div className="w-4 h-4 bg-white/60 rounded-full absolute top-0.5 right-0.5"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe size={18} style={{ color: '#F5F5DC' }} />
                    <div>
                      <p className="font-medium">Language</p>
                      <p className="text-white/60 text-sm">English</p>
                    </div>
                  </div>
                  <div className="text-white/60">→</div>
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