import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Video,
  Sparkles,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/formatters';

export interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { projects } = useProjectStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const recentProjects = projects.slice(0, 4);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Seedance 2.5 Studio', path: '/dashboard/seedance', icon: Sparkles, badge: 'PICSART' },
    { name: 'New Project', path: '/dashboard/new', icon: PlusCircle, badge: 'AI' },
    { name: 'All Projects', path: '/dashboard/projects', icon: FolderKanban },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden"
          style={{ background: 'var(--bg-page)', opacity: 0.8 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r transition-all duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'w-20' : 'w-64'
        )}
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Logo and Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <NavLink
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight leading-tight flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  ClipForge <span className="text-[#5145DE] dark:text-brand-300 font-extrabold text-xs uppercase px-1.5 py-0.5 rounded bg-brand-500/15 border border-brand-500/30">AI</span>
                </span>
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] dark:text-slate-400">Smart Video Repurposing</span>
              </div>
            )}
          </NavLink>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative',
                      isActive
                        ? 'bg-[#EAE8FF] text-[#5145DE] font-semibold border border-brand-200/80 shadow-sm dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30'
                        : 'text-[#374151] dark:text-slate-300 font-semibold hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'
                    )
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="text-[10px] font-bold bg-[#EAE8FF] text-[#5145DE] border border-brand-200 dark:bg-brand-500/20 dark:text-brand-300 dark:border-brand-500/30 px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Recent Projects Quick List */}
          {!isCollapsed && recentProjects.length > 0 && (
            <div className="pt-2">
              <div className="px-3 mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-slate-400">
                <span>Recent Projects</span>
                <NavLink
                  to="/dashboard/projects"
                  onClick={() => setMobileOpen(false)}
                  className="text-[11px] text-[#5145DE] dark:text-brand-400 font-bold hover:underline normal-case tracking-normal"
                >
                  View all
                </NavLink>
              </div>

              <div className="space-y-1">
                {recentProjects.map((p) => (
                  <NavLink
                    key={p.id}
                    to={`/dashboard/projects/${p.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors truncate',
                        isActive
                          ? 'bg-[#EAE8FF] text-[#5145DE] font-bold dark:bg-brand-500/15 dark:text-brand-300'
                          : 'text-[#374151] dark:text-slate-300 font-medium hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'
                      )
                    }
                  >
                    <Video className="w-3.5 h-3.5 shrink-0 text-[#5145DE] dark:text-slate-400" />
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] font-semibold shrink-0 ml-auto text-[var(--text-secondary)] dark:text-slate-400">
                      {p.clips.length} clips
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* Quick Create Highlight Box */}
          {!isCollapsed && (
            <div className="p-3.5 rounded-xl border text-xs shadow-sm" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 text-[#5145DE] dark:text-brand-300 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#5145DE] dark:text-brand-400" />
                <span>Quick Clip</span>
              </div>
              <p className="text-[11px] mb-3 leading-relaxed font-medium text-[var(--text-secondary)] dark:text-slate-400">
                Transform webinars or interviews into viral vertical clips in seconds.
              </p>
              <NavLink
                to="/dashboard/new"
                onClick={() => setMobileOpen(false)}
                className="block text-center w-full py-1.5 px-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                Upload Video
              </NavLink>
            </div>
          )}
        </div>

        {/* User profile / Footer */}
        <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-xl border shadow-sm',
              isCollapsed && 'justify-center p-1.5'
            )}
            style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/30 shrink-0"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold truncate text-[var(--text-primary)] dark:text-white">{user?.name || 'Creator'}</p>
                  <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-400/15 dark:text-amber-400 dark:border-amber-400/30 px-1 py-0.2 rounded uppercase">
                    {user?.plan || 'PRO'}
                  </span>
                </div>
                <p className="text-[11px] font-medium truncate text-[var(--text-secondary)] dark:text-slate-400">{user?.email || 'user@example.com'}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1 rounded-md text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
