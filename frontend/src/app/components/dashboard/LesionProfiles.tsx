import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabaseClient';
import { FolderPlus, User, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

export function LesionProfiles() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [nickname, setNickname] = useState('');
  const [bodyLocation, setBodyLocation] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user) loadProfiles();
  }, [user]);

  const loadProfiles = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('lesions')
      .select('*, scans(id)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setProfiles(data || []);
    setIsLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const { data, error } = await supabase
      .from('lesions')
      .insert([{
        user_id: user?.id,
        nickname,
        body_location: bodyLocation
      }])
      .select()
      .single();

    if (!error && data) {
      setProfiles([data, ...profiles]);
      setIsDialogOpen(false);
      setNickname('');
      setBodyLocation('');
    }
    setIsCreating(false);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => navigate(`/dashboard/lesions/${profile.id}`)}
              className="bg-card border border-border p-6 rounded-2xl text-left hover:shadow-md transition-all group flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div className="bg-muted px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground">
                  {profile.scans?.length || 0} Scans
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {profile.nickname}
              </h3>
              <p className="text-muted-foreground text-sm flex-1 mb-4">
                Location: {profile.body_location}
              </p>
              <div className="flex items-center text-primary text-sm font-medium mt-auto">
                View History <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
