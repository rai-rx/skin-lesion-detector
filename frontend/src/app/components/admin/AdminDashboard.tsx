import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Users, Activity, AlertTriangle, Loader2, Check, BarChart3, Target } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getApiUrl } from '../../../services/apiUrl';

type Analytics = {
  totalUsers: number;
  totalScans: number;
  accuracyFeedback: { total: number; accurate: number; inaccurate: number };
  verifiedClassification: { total: number; correct: number; incorrect: number; accuracyRate: number | null };
  confidenceDistribution: { bucket: string; count: number }[];
  triageDistribution: { risk: string; count: number }[];
  diagnosisDistribution: { diagnosis: string; count: number }[];
  longitudinalTracking: { date: string; scans: number; averageConfidence: number }[];
  imageQuality: { valid: number; rejected: number; failureRate: number | null; tracked: boolean };
  performance: { sensitivity: number | null; specificity: number | null; confirmedCases: number };
};

const emptyStats: Analytics = {
  totalUsers: 0, totalScans: 0,
  accuracyFeedback: { total: 0, accurate: 0, inaccurate: 0 },
  verifiedClassification: { total: 0, correct: 0, incorrect: 0, accuracyRate: null },
  confidenceDistribution: [], triageDistribution: [], diagnosisDistribution: [], longitudinalTracking: [],
  imageQuality: { valid: 0, rejected: 0, failureRate: null, tracked: false },
  performance: { sensitivity: null, specificity: null, confirmedCases: 0 },
};

const riskColors: Record<string, string> = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', unknown: '#94a3b8' };

const formatDiagnosisLabel = (diagnosis: string) => {
  if (diagnosis.toLowerCase() === 'squamous cell carcinoma') return 'SCC';
  if (diagnosis.length > 16) return `${diagnosis.slice(0, 14)}...`;
  return diagnosis;
};

function EmptyState() {
  return <div className="flex min-h-40 items-center justify-center text-sm text-slate-500">No data available yet</div>;
}

export function AdminDashboard() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Analytics>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.access_token) {
      loadAnalytics();
    }
  }, [session?.access_token]);

  const loadAnalytics = async () => {
    if (!session?.access_token) return;

    try {
      const res = await fetch(`${getApiUrl()}/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data: Analytics = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const confidenceAverage = stats.totalScans
    ? stats.longitudinalTracking.reduce((sum, day) => sum + day.averageConfidence * day.scans, 0) / stats.totalScans
    : 0;
  const diagnosisChartData = stats.diagnosisDistribution.map((item) => ({
    ...item,
    diagnosis: formatDiagnosisLabel(item.diagnosis),
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100">System Analytics</h1>
        <p className="mt-1 text-slate-500">Model performance and platform activity</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (<>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle><Users className="h-4 w-4 text-slate-500" /></CardHeader><CardContent><div className="text-3xl font-bold">{stats.totalUsers}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Scans</CardTitle><Activity className="h-4 w-4 text-slate-500" /></CardHeader><CardContent><div className="text-3xl font-bold">{stats.totalScans}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Average Confidence</CardTitle><BarChart3 className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-3xl font-bold">{confidenceAverage ? `${confidenceAverage.toFixed(1)}%` : 'N/A'}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Biopsy-Verified Classification</CardTitle><Check className="h-4 w-4 text-emerald-600" /></CardHeader><CardContent><div className="text-3xl font-bold">{stats.verifiedClassification.accuracyRate === null ? 'N/A' : `${stats.verifiedClassification.accuracyRate}%`}</div><div className="mt-2 flex gap-3 text-xs"><span className="text-emerald-600">{stats.verifiedClassification.correct} correct</span><span className="text-red-600">{stats.verifiedClassification.incorrect} incorrect</span></div></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Confidence Score Distribution</CardTitle></CardHeader><CardContent><div className="h-72">{stats.confidenceDistribution.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={stats.confidenceDistribution} margin={{ bottom: 18 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="bucket" interval={0} tick={{ fontSize: 10 }} tickMargin={8} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyState />}</div></CardContent></Card>
          <Card><CardHeader><CardTitle>Triage Distribution &amp; Risk Stratification</CardTitle></CardHeader><CardContent><div className="h-64">{stats.triageDistribution.some(item => item.count) ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.triageDistribution.filter(item => item.count)} dataKey="count" nameKey="risk" cx="50%" cy="50%" outerRadius={86} label={({ risk, percent }) => `${risk} ${(percent * 100).toFixed(0)}%`}>{stats.triageDistribution.filter(item => item.count).map(item => <Cell key={item.risk} fill={riskColors[item.risk] || riskColors.unknown} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <EmptyState />}</div></CardContent></Card>
          <Card><CardHeader><CardTitle>Longitudinal Tracking Metrics</CardTitle></CardHeader><CardContent><div className="h-64">{stats.longitudinalTracking.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={stats.longitudinalTracking}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis yAxisId="scans" allowDecimals={false} /><YAxis yAxisId="confidence" orientation="right" domain={[0, 100]} /><Tooltip /><Line yAxisId="scans" type="monotone" dataKey="scans" stroke="#2563eb" strokeWidth={2} /><Line yAxisId="confidence" type="monotone" dataKey="averageConfidence" stroke="#10b981" strokeWidth={2} /></LineChart></ResponsiveContainer> : <EmptyState />}</div><div className="mt-2 flex justify-center gap-2 text-[10px] text-slate-500 sm:gap-3"><span className="text-blue-600">Scan volume</span><span className="text-emerald-600">Average confidence</span></div></CardContent></Card>
          <Card><CardHeader><CardTitle>Diagnosis Distribution</CardTitle></CardHeader><CardContent><div className="h-64">{diagnosisChartData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={diagnosisChartData} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="diagnosis" width={65} /><Tooltip /><Bar dataKey="count" fill="#0f766e" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer> : <EmptyState />}</div></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Image Quality Failure Rate</CardTitle><AlertTriangle className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-3xl font-bold">{stats.imageQuality.failureRate === null ? 'N/A' : `${stats.imageQuality.failureRate}%`}</div><p className="mt-2 text-xs text-slate-500">{stats.imageQuality.tracked ? `${stats.imageQuality.rejected} rejected uploads` : 'Rejected uploads are not persisted yet'}</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Sensitivity</CardTitle><Target className="h-4 w-4 text-emerald-600" /></CardHeader><CardContent><div className="text-3xl font-bold">{stats.performance.sensitivity === null ? 'N/A' : `${stats.performance.sensitivity}%`}</div><p className="mt-2 text-xs text-slate-500">{stats.performance.confirmedCases} biopsy-confirmed cases</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Specificity</CardTitle><Target className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-3xl font-bold">{stats.performance.specificity === null ? 'N/A' : `${stats.performance.specificity}%`}</div><p className="mt-2 text-xs text-slate-500">Requires confirmed positive and negative cases</p></CardContent></Card>
        </div>
      </>)}
    </div>
  );
}
