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
          className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-dark-900 border-r border-slate-800 transition-all duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo and Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
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
                <span className="font-bold text-white text-base tracking-tight leading-tight flex items-center gap-1.5">
                  ClipForge <span className="text-brand-400 font-extrabold text-xs uppercase px-1.5 py-0.5 rounded bg-brand-500/15 border border-brand-500/30">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Smart Video Repurposing</span>
              </div>
            )}
          </NavLink>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
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
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group relative',
                      isActive
                        ? 'bg-brand-500/15 text-brand-300 border border-brand-500/25'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-dark-800/60'
                    )
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="text-[10px] font-semibold bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded border border-brand-500/30">
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
              <div className="px-3 mb-2 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Recent Projects</span>
                <NavLink
                  to="/dashboard/projects"
                  onClick={() => setMobileOpen(false)}
                  className="text-[11px] text-brand-400 hover:underline normal-case tracking-normal"
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
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors truncate',
                        isActive
                          ? 'bg-brand-500/15 text-brand-300'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/40'
                      )
                    }
                  >
                    <Video className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-auto">
                      {p.clips.length} clips
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* Quick Create Highlight Box */}
          {!isCollapsed && (
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-brand-950/60 to-dark-850 border border-brand-500/20 text-xs">
              <div className="flex items-center gap-2 text-brand-300 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Quick Clip</span>
              </div>
              <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">
                Transform webinars or interviews into viral vertical clips in seconds.
              </p>
              <NavLink
                to="/dashboard/new"
                onClick={() => setMobileOpen(false)}
                className="block text-center w-full py-1.5 px-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow transition-colors"
              >
                Upload Video
              </NavLink>
            </div>
          )}
        </div>

        {/* User profile / Footer */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-xl bg-dark-850/60 border border-slate-800/80',
              isCollapsed && 'justify-center p-1.5'
            )}
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/30 shrink-0"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-white truncate">{user?.name || 'Creator'}</p>
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1 py-0.2 rounded uppercase">
                    {user?.plan || 'PRO'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
