import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { getApiUrl } from '../../../services/apiUrl';
import { Camera, FolderPlus, Clock, ArrowRight, FileText, ScanLine } from 'lucide-react';
import { AdminDashboard } from '../admin/AdminDashboard';

export function DashboardHome() {
  const { user, session, isAdmin } = useAuth();
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
    if (user && session?.access_token) {
      loadDashboardData();
    }
  }, [user, session?.access_token]);

  const loadDashboardData = async () => {
    if (!session?.access_token) return;

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
    <div className="mx-auto max-w-7xl space-y-12">
      <div className="grid gap-8 border-b border-[#d7d2c7] pb-10 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div className="max-w-3xl">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#b66f45]">
            <span className="h-2 w-2 rounded-full bg-[#b66f45]" /> Personal health overview
          </div>
          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-[#24332d] md:text-7xl">
            Your skin, <span className="text-[#b66f45]">observed.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#607268]">Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}. Keep each check-in close, so small changes have somewhere to become visible.</p>
        </div>
        <div className="border-l-2 border-[#d8a36c] pl-5 text-sm text-[#607268]">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b66f45]">Today&apos;s intention</p>
          <p className="font-display text-2xl leading-tight text-[#24332d]">Notice what is new. Keep what matters.</p>
        </div>
      </div>

      {isAdmin && <AdminDashboard />}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-0 border-y border-[#d7d2c7] md:grid-cols-2">
        <button 
          onClick={() => navigate('/dashboard/scan', { state: { openCamera: true } })}
          className="group flex items-center gap-4 border-b border-[#d7d2c7] py-6 text-left transition-colors hover:bg-[#e3ebdf] md:border-b-0 md:border-r md:pr-8"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c9dcc4] text-[#2f604e]">
            <Camera className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#24332d]">New Scan</h3>
            <p className="text-sm text-[#607268]">Analyze a skin lesion</p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <button 
          onClick={() => navigate('/dashboard/lesions')}
          className="group flex items-center gap-4 py-6 text-left transition-colors hover:bg-[#e3ebdf] md:pl-8"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c9dcc4] text-[#2f604e]">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#24332d]">Add Profile</h3>
            <p className="text-sm text-[#607268]">Track a new mole or spot</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-0 border-b border-[#d7d2c7]">
        <div className="border-r border-[#d7d2c7] py-5 pr-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#607268]">Tracked profiles</p>
          <p className="mt-2 font-display text-5xl font-bold text-[#24332d]">{stats.profiles}</p>
        </div>
        <div className="py-5 pl-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#607268]">Total scans</p>
          <p className="mt-2 font-display text-5xl font-bold text-[#24332d]">{stats.scans}</p>
        </div>
      </div>

      {/* Recent Scans */}
      <div>
        <div className="mb-4 flex items-end justify-between border-b border-[#d7d2c7] pb-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-[#24332d]">Recent scans</h2>
            <p className="mt-1 text-sm text-[#607268]">Your latest activity at a glance</p>
          </div>
          <button onClick={() => navigate('/dashboard/lesions')} className="text-sm font-semibold text-[#b66f45] hover:underline">
            View All
          </button>
        </div>
        
        {recentScans.length === 0 ? (
          <div className="border-b border-[#d7d2c7] py-12 text-center">
            <Clock className="mx-auto mb-3 h-12 w-12 text-[#b9c7a9]" />
            <p className="text-[#607268]">No scans found. Start by creating a lesion profile and scanning it.</p>
          </div>
        ) : (
          <div>
            {recentScans.map((scan, index) => (
              <div key={scan.id} className="group flex items-center gap-5 border-b border-[#d7d2c7] px-3 py-7 transition-colors hover:bg-[#e3ebdf] md:px-5">
                <span className="w-6 text-xs text-[#a0aaa0]">0{index + 1}</span>
                {scan.image_url ? (
                  <img src={scan.image_url} alt="Lesion" className="h-16 w-16 rounded-full object-cover grayscale-[0.15]" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#dce4d4]">
                    <Camera className="h-6 w-6 text-[#607268]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-semibold text-[#24332d]">{scan.primary_diagnosis}</h4>
                  <p className="truncate text-sm text-[#607268]">
                    {scan.lesions?.nickname || 'Unassigned profile'} <span className="px-1 text-[#b9c7a9]">/</span> {formatScanDate(scan.scanned_at)}
                  </p>
                </div>
                <div className="flex-shrink-0 pl-3 text-right">
                  <div className={`text-sm font-medium ${
                    scan.risk_level === 'high' ? 'text-[#b34e3d]' :
                    scan.risk_level === 'medium' ? 'text-[#b66f45]' : 'text-[#2f604e]'
                  }`}>
                    {formatConfidence(scan.confidence_rate)}
                  </div>
                  {scan.pdf_report_url && (
                    <a href={scan.pdf_report_url} target="_blank" rel="noreferrer" className="mt-1 flex items-center justify-end gap-1 text-xs text-[#b66f45] hover:underline">
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
