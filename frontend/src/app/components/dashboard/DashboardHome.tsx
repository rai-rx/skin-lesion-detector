import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { getApiUrl } from '../../../services/apiUrl';
import { Camera, FolderPlus, Clock, ArrowRight, FileText, ScanLine } from 'lucide-react';

export function DashboardHome() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ profiles: 0, scans: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const getScanTime = (value: unknown) => {
    const timestamp = value ? new Date(String(value)).getTime() : NaN;
    return Number.isFinite(timestamp) ? timestamp : 0;
  };

  const formatScanDate = (value: unknown) => {
    const timestamp = getScanTime(value);
    return timestamp ? new Date(timestamp).toLocaleDateString() : 'Date unavailable';
  };

  const formatConfidence = (value: unknown) => {
    const confidence = Number(value);
    return Number.isFinite(confidence) ? `${confidence.toFixed(2)}% Confidence` : 'Confidence unavailable';
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/me/lesions`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Unable to load dashboard data');
      const lesionsData = await response.json();

      const statsProfiles = lesionsData?.length || 0;
      const scanCount = lesionsData.reduce((total: number, lesion: any) => total + (lesion.scans?.length || 0), 0);
      const recentScans = (lesionsData || [])
        .flatMap((lesion: any) => (lesion.scans || []).map((scan: any) => ({
          ...scan,
          lesions: { nickname: lesion.nickname },
        })))
        .sort((a: any, b: any) => getScanTime(b.scanned_at) - getScanTime(a.scanned_at))
        .slice(0, 3);

      setStats({
        profiles: statsProfiles,
        scans: scanCount,
      });
      setRecentScans(recentScans);
    } catch (error) {
      console.error('Unable to load dashboard data:', error);
      setStats({ profiles: 0, scans: 0 });
      setRecentScans([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-6 py-7 md:px-9 md:py-8 shadow-lg">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[24px] border-white/10" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-xs font-semibold uppercase tracking-[0.18em] mb-3">
            <ScanLine className="w-4 h-4" /> Personal health overview
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-primary-foreground/75 mt-2 max-w-lg">Keep your lesion records organized and make every scan part of a clearer health timeline.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/dashboard/scan')}
          className="flex items-center gap-4 p-5 bg-card border border-primary/20 text-foreground rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group text-left"
        >
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Camera className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">New Scan</h3>
            <p className="text-muted-foreground text-sm">Analyze a skin lesion</p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <button 
          onClick={() => navigate('/dashboard/lesions')}
          className="flex items-center gap-4 p-5 bg-card border border-border text-foreground rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group text-left"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Tracked Profiles</p>
          <p className="text-4xl font-display font-bold text-foreground mt-2">{stats.profiles}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Scans</p>
          <p className="text-4xl font-display font-bold text-foreground mt-2">{stats.scans}</p>
        </div>
      </div>

      {/* Recent Scans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Recent Scans</h2>
            <p className="text-sm text-muted-foreground mt-1">Your latest activity at a glance</p>
          </div>
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
                    {scan.lesions?.nickname || 'Unassigned profile'} • {formatScanDate(scan.scanned_at)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-medium ${
                    scan.risk_level === 'high' ? 'text-destructive' : 
                    scan.risk_level === 'medium' ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {formatConfidence(scan.confidence_rate)}
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
