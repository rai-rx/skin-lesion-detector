import { motion } from 'motion/react';
import { useNavigate, useLocation, Link } from 'react-router';
import { Activity, Menu, X, Home, Folder, FileText, User, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { getApiUrl } from '../../services/apiUrl';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Header({ onMenuClick, showMenu = true }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);
    setContactStatus(null);

    try {
      const response = await fetch(`${getApiUrl()}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Unable to send your message.');
      setContactStatus('Message sent successfully. We will get back to you soon.');
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      setContactStatus(error instanceof Error ? error.message : 'Unable to send your message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 bg-[#f4f0e8]/80 backdrop-blur-md"
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            {showMenu && <button
              type="button"
              onClick={() => onMenuClick ? onMenuClick() : setMenuOpen((open) => !open)}
              aria-label={onMenuClick ? 'Expand sidebar' : menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              title={onMenuClick ? 'Expand sidebar' : menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="rounded-full p-2 text-[#607268] transition-colors hover:bg-[#e3ebdf] hover:text-[#2f604e]"
            >
              {onMenuClick ? <Menu className="h-5 w-5" /> : menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>}
            <button
              onClick={() => navigate('/')}
              className="group flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#806348] text-[#806348] transition-colors group-hover:border-[#2f604e] group-hover:text-[#2f604e]">
                <Activity className="h-4 w-4" />
              </div>
              <h1 className="font-display text-xl font-bold leading-tight text-[#40352d]">SkinEleven</h1>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link
              to="/about"
              className="px-3 py-2 text-sm font-medium text-[#607268] transition-colors hover:text-[#2f604e]"
            >
              About Us
            </Link>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              aria-label="Open Contact Us form"
              className="px-3 py-2 text-sm font-medium text-[#607268] transition-colors hover:text-[#2f604e]"
            >
              Contact Us
            </button>
            {!user && (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-[#607268] transition-colors hover:text-[#2f604e]">
                  Sign In
                </Link>
                <Link to="/register" className="bg-[#2f604e] px-4 py-2 text-sm font-medium text-[#f4f0e8] transition-colors hover:bg-[#244c3e]">
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
        {showMenu && !onMenuClick && menuOpen && (
          <div className="fixed inset-0 z-[100] flex min-h-screen">
            <button type="button" aria-label="Close navigation menu" onClick={closeMenu} className="absolute inset-0 bg-[#24332d]/25" />
            <aside className="relative flex h-screen max-h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-[#665548] bg-[#40352d] text-[#f8f0e5] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#665548] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d2b17f] text-[#d2b17f]"><Activity className="h-4 w-4" /></div>
                  <span className="font-display text-xl font-bold">SkinEleven</span>
                </div>
                <button type="button" onClick={closeMenu} aria-label="Close navigation menu" className="p-2 text-[#d3c1ae] transition-colors hover:bg-[#4c4036] hover:text-[#f8f0e5]"><X className="h-5 w-5" /></button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
                {[
                  { name: 'Overview', href: '/dashboard', icon: Home },
                  { name: 'Lesion Profiles', href: '/dashboard/lesions', icon: Folder },
                  { name: 'PDF Vault', href: '/dashboard/pdfs', icon: FileText },
                ].map((item, index) => (
                  <Link key={item.name} to={item.href} onClick={closeMenu} className={`flex items-center gap-3 border-l-2 px-3 py-3 text-sm tracking-wide transition-colors ${(item.href === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.href)) ? 'border-[#d2b17f] bg-[#57483c] text-[#f8f0e5]' : 'border-transparent text-[#d3c1ae] hover:border-[#bd9a6c] hover:bg-[#4c4036] hover:text-[#f8f0e5]'}`}>
                    <span className="w-5 text-[10px] font-semibold text-[#bd9a6c]">0{index + 1}</span>
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </nav>
              {user && (
                <div className="border-t border-[#665548] p-4">
                  <button type="button" onClick={() => { closeMenu(); navigate('/settings'); }} aria-label="Open account settings" className="group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[#4c4036]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d2b17f] text-[#40352d]"><User className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#f8f0e5]">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="truncate text-xs text-[#d3c1ae]">{user.email}</p>
                    </div>
                    <Settings className="ml-auto h-4 w-4 text-[#d3c1ae] opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="border-[#D3C2B0] bg-[#FAF7F2] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#33443D]">Contact SkinEleven</DialogTitle>
            <DialogDescription className="text-[#5F514B]">
              Send us a message directly through the SkinEleven support team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="contact-name" className="text-sm font-medium text-[#33443D]">Name</label>
              <input
                id="contact-name"
                required
                value={contactForm.name}
                onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
                className="w-full border border-[#D3C2B0] bg-white px-3 py-2.5 text-sm text-[#33443D] outline-none focus:border-[#2f604e] focus:ring-2 focus:ring-[#2f604e]/20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="contact-email" className="text-sm font-medium text-[#33443D]">Email</label>
              <input
                id="contact-email"
                required
                type="email"
                value={contactForm.email}
                onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
                className="w-full border border-[#D3C2B0] bg-white px-3 py-2.5 text-sm text-[#33443D] outline-none focus:border-[#2f604e] focus:ring-2 focus:ring-[#2f604e]/20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="contact-message" className="text-sm font-medium text-[#33443D]">Message</label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={contactForm.message}
                onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })}
                className="w-full resize-y border border-[#D3C2B0] bg-white px-3 py-2.5 text-sm text-[#33443D] outline-none focus:border-[#2f604e] focus:ring-2 focus:ring-[#2f604e]/20"
              />
            </div>
            {contactStatus && (
              <p role="status" className="border-l-2 border-[#2f604e] bg-[#e3ebdf] px-3 py-2 text-sm text-[#2f604e]">
                {contactStatus}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setContactOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSending} className="bg-[#2f604e] text-white hover:bg-[#244c3e]">
                {isSending ? 'Sending...' : 'Send Message'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </motion.header>
  );
}
