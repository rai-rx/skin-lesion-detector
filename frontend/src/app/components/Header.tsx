import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation, Link } from 'react-router';
import { Activity, Menu, X, Home, Folder, FileText, User, Settings, Mail, Send, CircleCheck, CircleAlert } from 'lucide-react';
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
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
      setContactStatus({ kind: 'success', message: 'Message sent. The SkinEleven team will be in touch.' });
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      setContactStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Unable to send your message.' });
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
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo/Brand */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {showMenu && <button
              type="button"
              onClick={() => onMenuClick ? onMenuClick() : setMenuOpen((open) => !open)}
              aria-label={onMenuClick ? 'Expand sidebar' : menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              title={onMenuClick ? 'Expand sidebar' : menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="rounded-full p-1.5 text-[#607268] transition-colors hover:bg-[#e3ebdf] hover:text-[#2f604e] sm:p-2"
            >
              {onMenuClick ? <Menu className="h-4 w-4 sm:h-5 sm:w-5" /> : menuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>}
            <button
              onClick={() => navigate('/')}
              className="group flex min-w-0 items-center gap-2 sm:gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#806348] text-[#806348] transition-colors group-hover:border-[#2f604e] group-hover:text-[#2f604e] sm:h-9 sm:w-9">
                <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <h1 className="truncate font-display text-base font-bold leading-tight text-[#40352d] sm:text-xl">SkinEleven</h1>
            </button>
          </div>

          {/* Navigation */}
          <nav className="hidden items-center justify-end gap-4 md:flex">
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

          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="p-1.5 text-[#2f604e] transition-colors hover:text-[#1d3a2f] focus:outline-none"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden overflow-hidden"
            >
              <motion.nav
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="mt-3 flex flex-col gap-2 rounded-2xl border border-[#D3C2B0] bg-[#FAF7F2] p-3 shadow-sm"
              >
                <Link
                  to="/about"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[#607268] transition-colors hover:bg-[#e3ebdf] hover:text-[#2f604e]"
                >
                  About Us
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setContactOpen(true);
                    setMobileNavOpen(false);
                  }}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-[#607268] transition-colors hover:bg-[#e3ebdf] hover:text-[#2f604e]"
                >
                  Contact Us
                </button>
                {!user && (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileNavOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-[#607268] transition-colors hover:bg-[#e3ebdf] hover:text-[#2f604e]"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileNavOpen(false)}
                      className="rounded-lg bg-[#2f604e] px-3 py-2 text-center text-sm font-medium text-[#f4f0e8] transition-colors hover:bg-[#244c3e]"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
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
        <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto rounded-xl border-0 bg-[#FAF7F2] p-0 shadow-2xl sm:max-w-3xl">
          <div className="grid md:grid-cols-[0.82fr_1.18fr]">
            <aside className="flex flex-col justify-between gap-10 bg-[#33443D] p-7 text-[#FAF7F2] sm:p-9">
              <div>
                <div className="mb-10 flex h-11 w-11 items-center justify-center border border-[#91a79b]/50 bg-[#40574d] text-[#e5b393]">
                  <Mail className="h-5 w-5" />
                </div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e5b393]">SkinEleven support</p>
                <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">Let’s talk.</h2>
                <p className="mt-4 max-w-xs text-sm leading-6 text-[#d8e0d9]/80">
                  Questions, feedback, or a hand with your account? Send a note to our team.
                </p>
              </div>
              <div className="border-t border-[#91a79b]/40 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d8e0d9]/60">A note from you</p>
                <p className="mt-2 text-sm leading-6 text-[#d8e0d9]/85">Messages go directly to the SkinEleven support team.</p>
              </div>
            </aside>

            <div className="p-6 sm:p-9">
              <DialogHeader className="mb-7 pr-7">
                <DialogTitle className="font-display text-2xl font-bold text-[#33443D]">Contact us</DialogTitle>
                <DialogDescription className="text-sm leading-6 text-[#607268]">
                  Fill in the details below and we’ll get back to you.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="contact-name" className="text-sm font-semibold text-[#33443D]">Name</label>
                    <input
                      id="contact-name"
                      required
                      autoComplete="name"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
                      className="h-11 w-full rounded-md border border-[#D3C2B0] bg-white px-3.5 text-sm text-[#33443D] outline-none transition-shadow placeholder:text-[#9b8c80] focus:border-[#2f604e] focus:ring-2 focus:ring-[#2f604e]/15"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-email" className="text-sm font-semibold text-[#33443D]">Email</label>
                    <input
                      id="contact-email"
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={contactForm.email}
                      onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
                      className="h-11 w-full rounded-md border border-[#D3C2B0] bg-white px-3.5 text-sm text-[#33443D] outline-none transition-shadow placeholder:text-[#9b8c80] focus:border-[#2f604e] focus:ring-2 focus:ring-[#2f604e]/15"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-message" className="text-sm font-semibold text-[#33443D]">Message</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder="How can we help?"
                    value={contactForm.message}
                    onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })}
                    className="w-full resize-y rounded-md border border-[#D3C2B0] bg-white px-3.5 py-3 text-sm leading-6 text-[#33443D] outline-none transition-shadow placeholder:text-[#9b8c80] focus:border-[#2f604e] focus:ring-2 focus:ring-[#2f604e]/15"
                  />
                </div>
                {contactStatus && (
                  <div
                    role="status"
                    className={`flex items-start gap-2.5 border px-3.5 py-3 text-sm leading-5 ${contactStatus.kind === 'success' ? 'border-[#c3d5c9] bg-[#e3ebdf] text-[#2f604e]' : 'border-[#dfb9ad] bg-[#f7e9e4] text-[#8a3c2b]'}`}
                  >
                    {contactStatus.kind === 'success' ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{contactStatus.message}</span>
                  </div>
                )}
                <DialogFooter className="border-t border-[#e2d8cc] pt-5 sm:justify-between">
                  <Button type="button" variant="ghost" onClick={() => setContactOpen(false)} className="text-[#607268] hover:bg-[#ece6dc] hover:text-[#33443D]">Cancel</Button>
                  <Button type="submit" disabled={isSending} className="h-11 bg-[#2f604e] px-5 text-white hover:bg-[#244c3e]">
                    {isSending ? 'Sending...' : <><Send className="h-4 w-4" /> Send message</>}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </motion.header>
  );
}
