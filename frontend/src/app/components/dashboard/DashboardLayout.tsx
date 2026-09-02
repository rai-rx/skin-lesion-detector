import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Activity, Home, Folder, FileText, User, Settings, Menu, X, PanelLeftClose } from 'lucide-react';
import { motion } from 'motion/react';
import { Header } from '../Header';

export function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Lesion Profiles', href: '/dashboard/lesions', icon: Folder },
    { name: 'PDF Vault', href: '/dashboard/pdfs', icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f0e8] text-[#24332d]">
      {/* Sidebar */}
      <div className={`hidden flex-col border-r border-[#665548] bg-[#40352d] text-[#f8f0e5] transition-[width] duration-300 md:flex ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'}`}>
        <div className="p-6 pb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d2b17f] text-[#d2b17f]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-display text-xl font-bold leading-none">SkinEleven</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="ml-auto rounded-full p-2 text-[#d3c1ae] transition-colors hover:bg-[#4c4036] hover:text-[#f8f0e5]"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navigation.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 border-l-2 px-3 py-3 transition-colors ${
                  active
                    ? 'border-[#d2b17f] bg-[#57483c] text-[#f8f0e5]'
                    : 'border-transparent text-[#d3c1ae] hover:border-[#bd9a6c] hover:bg-[#4c4036] hover:text-[#f8f0e5]'
                }`}
              >
                <span className="w-5 text-[10px] font-semibold text-[#bd9a6c]">0{index + 1}</span>
                <item.icon className="h-4 w-4" />
                <span className="text-sm tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#665548] p-4">
          <button
            type="button"
            onClick={() => { setSidebarOpen(false); navigate('/settings'); }}
            aria-label="Open account settings"
            className="group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[#4c4036]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d2b17f] text-[#40352d]">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[#f8f0e5]">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="truncate text-xs text-[#d3c1ae]">{user?.email}</p>
            </div>
            <Settings className="ml-auto h-4 w-4 text-[#d3c1ae] opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-[#d7d2c7] bg-[#f4f0e8] p-4 md:hidden">
          <div className="flex items-center gap-2">
             <Activity className="h-6 w-6 text-[#1f302b]" />
             <span className="font-display text-lg font-bold">SkinEleven</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 text-[#607268] transition-colors hover:bg-[#e5dfd3] hover:text-[#1f302b]"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={closeMobileMenu}
              className="fixed inset-0 z-40 bg-black/30 md:hidden"
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#665548] bg-[#40352d] text-[#f8f0e5] shadow-xl md:hidden">
              <div className="flex items-center justify-between border-b border-[#665548] p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-[#d2b17f]" />
                  <span className="font-display font-bold text-lg">SkinEleven</span>
                </div>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  aria-label="Close navigation menu"
                  className="p-2 text-[#d3c1ae] transition-colors hover:bg-[#4c4036] hover:text-[#f8f0e5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 p-4">
                {navigation.map((item, index) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 border-l-2 px-3 py-3 transition-colors ${
                        active
                          ? 'border-[#d2b17f] bg-[#57483c] text-[#f8f0e5]'
                          : 'border-transparent text-[#d3c1ae] hover:border-[#bd9a6c] hover:bg-[#4c4036] hover:text-[#f8f0e5]'
                      }`}
                    >
                      <span className="w-5 text-[10px] text-[#bd9a6c]">0{index + 1}</span>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm tracking-wide">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-[#665548] p-4">
                <button
                  type="button"
                  onClick={() => { closeMobileMenu(); navigate('/settings'); }}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left text-[#d3c1ae] transition-colors hover:bg-[#4c4036] hover:text-[#f8f0e5]"
                >
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground truncate">Account Settings</span>
                  <Settings className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              </div>
            </aside>
          </>
        )}

        {!sidebarOpen && <Header onMenuClick={() => setSidebarOpen(true)} />}

        <main
          onClick={() => setSidebarOpen(false)}
          className="relative flex-1 overflow-y-auto bg-[radial-gradient(circle_at_85%_0%,rgba(89,137,94,0.18),transparent_28rem)] p-4 md:p-8 lg:p-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
