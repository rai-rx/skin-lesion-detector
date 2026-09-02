import { useState } from 'react';
import { useNavigate } from 'react-router';
import { KeyRound, LogOut, Save, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabaseClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function AccountSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!user?.email) {
      setError('Unable to identify the signed-in account.');
      return;
    }

    if (newPassword.length < 6) {
      setError('The new password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      const { error: verificationError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verificationError) {
        setError('The current password is incorrect.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully.');
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'Unable to update the password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account details and password.</p>
      </div>

      <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-foreground truncate">
              {user?.user_metadata?.full_name || 'User'}
            </h2>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="pt-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" /> Change Password
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Confirm your current password before setting a new one.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Re-enter new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <Button type="submit" disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </section>

      <div className="flex justify-center">
        <Button type="button" variant="outline" onClick={() => void handleSignOut()} className="gap-2 shrink-0">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
