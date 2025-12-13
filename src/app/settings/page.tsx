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
      <div className="w-full max-w-[440px] mx-auto space-y-6">
        <Header title="Settings" centered />

        <div className="space-y-4">
          {/* Profile Card */}
          <div className="bg-[#0A0E27] border border-white/5 rounded-[32px] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5F5DC]/5 rounded-bl-[100px] pointer-events-none" />

            <div className="text-center mb-6 relative z-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#F5F5DC] to-white/90 mx-auto flex items-center justify-center mb-3 shadow-lg shadow-[#F5F5DC]/20">
                <span className="text-2xl font-bold text-[#0A0E27]">
                  {user?.firstName?.[0] || 'U'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{user?.fullName || user?.firstName || 'User'}</h2>
              <p className="text-white/40 text-xs font-medium">{user?.email || 'Loading...'}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">User ID</span>
                <span className="text-sm font-mono text-white/40">{user?.id?.slice(0, 8) || '...'}</span>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">Member Since</span>
                <span className="text-sm text-white/40">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '...'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button className="w-full bg-[#0F142D]/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all">
              <span className="font-bold text-white">Security</span>
              <span className="text-white/20 group-hover:text-white/60 text-xs font-bold uppercase tracking-wider">Manage</span>
            </button>
            <button className="w-full bg-[#0F142D]/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all">
              <span className="font-bold text-white">Notifications</span>
              <div className="w-8 h-4 bg-green-500/20 rounded-full relative">
                <div className="absolute right-0.5 top-0.5 bottom-0.5 w-3 bg-green-500 rounded-full" />
              </div>
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full p-4 rounded-2xl flex items-center justify-center gap-2 text-red-400 font-bold hover:bg-red-500/10 transition-colors mt-4"
            >
              <Power size={18} />
              Sign Out
            </button>
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