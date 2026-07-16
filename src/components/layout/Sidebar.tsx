'use client';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon, 
  Activity,
  Award
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const pathname = usePathname();

  if (!_hasHydrated || !isAuthenticated) return null;

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error('Logout failed on backend', e);
    }
    logout();
    window.location.href = '/';
  };

  const getLinksForRole = () => {
    switch (user?.role) {
      case 'Admin':
        return [
          { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
          { name: 'Leaderboard', href: '/leaderboard', icon: Award },
          { name: 'Settings', href: '/admin/settings', icon: Settings },
        ];
      case 'Examiner':
        return [
          { name: 'Dashboard', href: '/examiner', icon: LayoutDashboard },
          { name: 'Profile', href: '/profile', icon: UserIcon },
        ];
      case 'Candidate':
        return [
          { name: 'My Exams', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Past Results', href: '/past-results', icon: Activity },
          { name: 'Leaderboard', href: '/leaderboard', icon: Award },
          { name: 'Profile', href: '/profile', icon: UserIcon },
        ];
      default:
        return [];
    }
  };

  const links = getLinksForRole();

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64 shadow-xl shadow-bsg-blue/5 z-40">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-gray-50 to-white">
        <Link href={user?.role === 'Admin' ? '/admin' : user?.role === 'Examiner' ? '/examiner' : '/dashboard'} className="flex items-center gap-2 group" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bsg-blue to-bsg-blue-light flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <span className="text-white font-extrabold text-xs">BSG</span>
          </div>
          <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-bsg-blue to-bsg-gold tracking-tight">
            CBT
          </span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Main Menu</p>
        {links.map((link) => {
          // Highlight if current path strictly equals link, or starts with it (except for dashboard which is root-like)
          let isActive = pathname === link.href;
          if (link.href !== '/admin' && link.href !== '/examiner' && link.href !== '/dashboard' && pathname?.startsWith(link.href)) {
            isActive = true;
          }

          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                isActive 
                  ? 'bg-bsg-blue text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500'} />
              {link.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4 px-2">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-bsg-blue/20" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <UserIcon size={20} />
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-gray-900 text-sm truncate">{user?.name}</span>
            <span className="text-xs text-bsg-blue font-semibold uppercase tracking-wider truncate">{user?.role}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl transition-colors text-sm border border-red-100"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}
