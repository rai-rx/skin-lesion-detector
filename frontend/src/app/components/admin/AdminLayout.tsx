import React from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Activity, LayoutDashboard, Users, AlertCircle, ClipboardList, LogOut, ArrowLeft } from 'lucide-react';

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Analytics', href: '/admin', icon: LayoutDashboard },
    { name: 'User Directory', href: '/admin/users', icon: Users },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Admin Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-50 border-r border-slate-800 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">Admin Panel</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                  active 
                    ? 'bg-blue-600 text-white font-medium' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to App</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-xl text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
