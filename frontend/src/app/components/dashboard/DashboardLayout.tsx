import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Activity, Home, Folder, FileText, User, Settings, Shield, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';

export function DashboardLayout() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Lesion Profiles', href: '/dashboard/lesions', icon: Folder },
    { name: 'PDF Vault', href: '/dashboard/pdfs', icon: FileText },
  ];

  if (isAdmin) {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-background bg-[radial-gradient(circle_at_top_right,rgba(193,123,92,0.12),transparent_32rem)]">
      {/* Sidebar */}
      <div className="w-72 bg-card/90 backdrop-blur-sm border-r border-border hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-border/70">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-xl text-foreground block leading-none">SkinEleven</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Skin health journal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  active 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="Open account settings"
            className="flex items-center gap-3 w-full px-3 py-3 text-left rounded-xl hover:bg-muted transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Settings className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Activity className="w-6 h-6 text-primary" />
             <span className="font-display font-bold text-lg">SkinEleven</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
            <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-xl md:hidden flex flex-col">
              <div className="p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary" />
                  <span className="font-display font-bold text-lg">SkinEleven</span>
                </div>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  aria-label="Close navigation menu"
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => { closeMobileMenu(); navigate('/settings'); }}
                  className="flex items-center gap-3 w-full px-3 py-3 text-left rounded-xl hover:bg-muted transition-colors"
                >
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground truncate">Account Settings</span>
                  <Settings className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              </div>
            </aside>
          </>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
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
