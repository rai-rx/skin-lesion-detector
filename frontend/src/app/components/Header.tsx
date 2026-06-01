import { motion } from 'motion/react';
import { useNavigate, useLocation, Link } from 'react-router';
import { Activity, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="block text-left">
              <h1 className="text-xl font-display font-bold leading-tight">SkinEleven</h1>
            </div>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {!user ? (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors px-3 py-2">
                  Sign In
                </Link>
                <Link to="/register" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm">
                  Get Started
                </Link>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-muted p-1.5 rounded-full transition-colors outline-none">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <div className="px-2 py-1.5 text-sm font-medium truncate">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="gap-2 cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 cursor-pointer text-blue-600 focus:text-blue-600">
                      <Shield className="w-4 h-4" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="gap-2 text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
