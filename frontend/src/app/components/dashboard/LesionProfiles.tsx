import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { getApiUrl } from '../../../services/apiUrl';
import { FolderPlus, User, Loader2, ArrowRight, MoreVertical, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

export function LesionProfiles() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [nickname, setNickname] = useState('');
  const [bodyLocation, setBodyLocation] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user && session?.access_token) loadProfiles();
  }, [user, session?.access_token]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  });

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/me/lesions`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Unable to load lesion profiles');
      const data = await response.json();
      setProfiles(data || []);
    } catch (error) {
      console.error('Unable to load lesion profiles:', error);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch(`${getApiUrl()}/me/lesions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nickname,
          body_location: bodyLocation,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Unable to create lesion profile');

      setProfiles((current) => [data, ...current]);
      setIsDialogOpen(false);
      setNickname('');
      setBodyLocation('');
    } catch (error) {
      console.error('Unable to create lesion profile:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!profileToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${getApiUrl()}/me/lesions/${profileToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Unable to delete lesion profile');
      }

      setProfiles((current) => current.filter((item) => item.id !== profileToDelete.id));
      setProfileToDelete(null);
    } catch (error) {
      console.error('Unable to delete lesion profile:', error);
      window.alert(error instanceof Error ? error.message : 'Unable to delete lesion profile.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Lesion Profiles</h1>
          <p className="text-muted-foreground mt-1">Organize your scans by specific moles or spots</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FolderPlus className="w-4 h-4" /> Add Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Lesion Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  placeholder="e.g., Left Shoulder Spot"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Body Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Left Shoulder"
                  value={bodyLocation}
                  onChange={(e) => setBodyLocation(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Profile"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderPlus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No profiles yet</h3>
          <p className="text-muted-foreground mb-6">Create a profile for a specific mole to start tracking its changes over time.</p>
          <Button onClick={() => setIsDialogOpen(true)}>Create First Profile</Button>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <div
              key={profile.id}
              onClick={() => navigate(`/dashboard/lesions/${profile.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/dashboard/lesions/${profile.id}`);
                }
              }}
              role="button"
              tabIndex={0}
              className="relative bg-card border border-border p-6 rounded-2xl text-left hover:shadow-md transition-all group flex flex-col h-full"
            >
              <div className="flex items-start mb-4 pr-8">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute top-4 right-4" onClick={(event) => event.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Actions for ${profile.nickname}`}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setProfileToDelete(profile)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Profile
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {profile.nickname}
              </h3>
              <p className="text-muted-foreground text-sm flex-1 mb-4">
                Location: {profile.body_location === 'Unspecified body location' || !profile.body_location ? 'Unspecified' : profile.body_location}
                <span className="block mt-1">{profile.scans?.length || 0} Scans</span>
              </p>
              <div className="flex items-center text-primary text-sm font-medium mt-auto">
                View History <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </div>
            </div>
          ))}
        </div>
        <Dialog open={Boolean(profileToDelete)} onOpenChange={(open) => !open && setProfileToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle>Delete lesion profile?</DialogTitle>
              <DialogDescription>
                This will permanently delete <strong className="text-foreground">{profileToDelete?.nickname}</strong> and all scans saved under this profile. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col-reverse sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setProfileToDelete(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting} className="gap-2">
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete Profile'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>
      )}
    </div>
  );
}
