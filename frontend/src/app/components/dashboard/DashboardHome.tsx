import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabaseClient';
import { Camera, FolderPlus, Clock, ArrowRight, AlertTriangle, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ profiles: 0, scans: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    // Get profiles count
    const { count: profilesCount } = await supabase
      .from('lesions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id);

    // Get scans count and recent scans by joining lesions
    const { data: lesionsData } = await supabase
      .from('lesions')
      .select('id, nickname')
      .eq('user_id', user?.id);

    if (lesionsData && lesionsData.length > 0) {
      const lesionIds = lesionsData.map(l => l.id);
      
      const { count: scansCount } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .in('lesion_id', lesionIds);

      const { data: recent } = await supabase
        .from('scans')
        .select('*, lesions(nickname)')
        .in('lesion_id', lesionIds)
        .order('scanned_at', { ascending: false })
        .limit(3);

      setStats({
        profiles: profilesCount || 0,
        scans: scansCount || 0
      });
      setRecentScans(recent || []);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Welcome, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-muted-foreground mt-1">Here is the overview of your skin health tracking.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/scan')}
          className="flex items-center gap-4 p-6 bg-primary text-primary-foreground rounded-2xl shadow-md hover:shadow-lg transition-all group text-left"
        >
          <div className="p-3 bg-white/20 rounded-xl">
            <Camera className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">New Scan</h3>
            <p className="text-primary-foreground/80 text-sm">Analyze a skin lesion</p>
          </div>
          <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <button 
          onClick={() => navigate('/dashboard/lesions')}
          className="flex items-center gap-4 p-6 bg-card border border-border text-foreground rounded-2xl shadow-sm hover:shadow-md transition-all group text-left"
        >
          <div className="p-3 bg-accent/10 text-accent rounded-xl">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Add Profile</h3>
            <p className="text-muted-foreground text-sm">Track a new mole or spot</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tracked Profiles</CardDescription>
            <CardTitle className="text-4xl">{stats.profiles}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Scans</CardDescription>
            <CardTitle className="text-4xl">{stats.scans}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Scans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Scans</h2>
          <button onClick={() => navigate('/dashboard/lesions')} className="text-sm text-primary hover:underline">
            View All
          </button>
        </div>
        
        {recentScans.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No scans found. Start by creating a lesion profile and scanning it.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentScans.map((scan) => (
              <div key={scan.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-sm transition-shadow">
                {scan.image_url ? (
                  <img src={scan.image_url} alt="Lesion" className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{scan.primary_diagnosis}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {scan.lesions?.nickname} • {new Date(scan.scanned_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-medium ${
                    scan.risk_level === 'high' ? 'text-destructive' : 
                    scan.risk_level === 'medium' ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {scan.confidence_rate}% Confidence
                  </div>
                  {scan.pdf_report_url && (
                    <a href={scan.pdf_report_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center justify-end gap-1 mt-1">
                      <FileText className="w-3 h-3" /> View Report
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
