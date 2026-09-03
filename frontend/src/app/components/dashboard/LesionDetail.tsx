import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { getApiUrl } from '../../../services/apiUrl';
import { ArrowLeft, Camera, Activity, Calendar, FileText, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SymptomLogger } from './SymptomLogger';
import { format } from 'date-fns';
import { generateScanPdf, type ScanPdfData } from '../../../services/generatePdf';

export function LesionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [expandedScan, setExpandedScan] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);
  const [openingPdfId, setOpeningPdfId] = useState<string | null>(null);

  useEffect(() => {
    if (id && session?.access_token) {
      loadProfileAndScans();
    }
  }, [id, session?.access_token]);

  const getAuthHeaders = (includeJson = false) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${session?.access_token}`,
    };
    if (includeJson) headers['Content-Type'] = 'application/json';
    return headers;
  };

  const handleProfileSave = async () => {
    if (!id || !profile) return;

    setIsSavingProfile(true);
    try {
      const response = await fetch(`${getApiUrl()}/me/lesions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          nickname: nicknameInput.trim() || profile.nickname,
          body_location: locationInput.trim() || profile.body_location,
        }),
      });

      if (!response.ok) throw new Error('Unable to save lesion details');
      const data = await response.json();
      setProfile(data);
      setNicknameInput(data.nickname || '');
      setLocationInput(data.body_location || '');
    } catch (error) {
      console.error('Unable to save lesion details:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAccuracyFeedback = async (scanId: string, feedback: 'accurate' | 'inaccurate') => {
    setSavingFeedbackId(scanId);
    try {
      const response = await fetch(`${getApiUrl()}/me/scans/${scanId}/accuracy`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ feedback }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || 'Unable to save scan feedback');
      }
      setScans((current) => current.map((scan) => (
        scan.id === scanId
          ? { ...scan, user_accuracy_feedback: feedback }
          : scan
      )));
    } catch (error) {
      console.error('Unable to save scan feedback:', error);
    } finally {
      setSavingFeedbackId(null);
    }
  };

  const handleOpenPdf = async (scan: any) => {
    setOpeningPdfId(scan.id);
    const reportWindow = window.open('', '_blank');
    try {
      if (scan.pdf_report_url) {
        if (!reportWindow) throw new Error('The PDF window was blocked. Please allow pop-ups and try again.');
        reportWindow.location.href = scan.pdf_report_url;
      } else {
        const pdfData: ScanPdfData = {
          classification: scan.primary_diagnosis || 'Unknown',
          confidence: scan.confidence_rate || 0,
          riskLevel: scan.risk_level || 'low',
          secondaryPredictions: scan.secondary_findings || [],
          abcdeMetrics: scan.abcde_metrics || {
            asymmetry: 0,
            borderIrregularity: 0,
            colorDivergence: 0,
            diameterProfile: 0,
            evolvingTracking: 0,
          },
          imageUrl: scan.image_url || '',
          heatmapUrl: scan.heatmap_url,
        };
        const blob = await generateScanPdf(pdfData);
        const url = URL.createObjectURL(blob);
        if (!reportWindow) throw new Error('The PDF window was blocked. Please allow pop-ups and try again.');
        reportWindow.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (error) {
      reportWindow?.close();
      console.error('PDF opening failed:', error);
      window.alert(error instanceof Error ? error.message : 'Unable to open this PDF report. Please try again.');
    } finally {
      setOpeningPdfId(null);
    }
  };

  const loadProfileAndScans = async () => {
    try {
      const profileResponse = await fetch(`${getApiUrl()}/me/lesions/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!profileResponse.ok) throw new Error('Unable to load lesion profile');
      const profileData = await profileResponse.json();
      setProfile(profileData);
      setNicknameInput(profileData.nickname || '');
      setLocationInput(profileData.body_location || '');

      const scansResponse = await fetch(`${getApiUrl()}/me/lesions/${id}/scans`, {
        headers: getAuthHeaders(),
      });
      if (!scansResponse.ok) throw new Error('Unable to load lesion scans');
      const scansData = await scansResponse.json();

      const sortedScans = [...(scansData || [])].reverse();
      setScans(sortedScans);

      const dataForChart = (scansData || []).map((s: any) => ({
        date: format(new Date(s.scanned_at), 'MMM dd, yy'),
        confidence: s.confidence_rate,
        diagnosis: s.primary_diagnosis,
        risk: s.risk_level,
      }));
      setChartData(dataForChart);
    } catch (error) {
      console.error('Unable to load lesion details:', error);
      setProfile(null);
      setScans([]);
      setChartData([]);
    }
  };

  if (!profile) return <div className="p-12 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard/lesions')}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                className="text-3xl font-display font-bold bg-transparent border-b border-border px-1 py-1 outline-none min-w-[220px]"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Location:</span>
              <input
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="bg-transparent border-b border-border px-1 py-1 outline-none min-w-[180px]"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleProfileSave} disabled={isSavingProfile}>
            {isSavingProfile ? 'Saving...' : 'Save Details'}
          </Button>
          <Button onClick={() => navigate('/dashboard/scan', { state: { lesion_id: profile.id, openCamera: true } })} className="gap-2">
            <Camera className="w-4 h-4" /> New Scan for this Profile
          </Button>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Primary Diagnosis Confidence Over Time</h2>
        </div>
        {chartData.length > 1 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dx={-10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '0.5rem' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="var(--primary)" 
                  strokeWidth={3}
                  dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Confidence %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">More scans needed to generate a timeline chart.</p>
          </div>
        )}
      </div>

      {/* Scan History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Scan History</h2>
        {scans.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
            No scans recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {scans.map(scan => (
              <div key={scan.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div 
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}
                >
                  {scan.image_url ? (
                    <img src={scan.image_url} alt="Scan thumbnail" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold">{scan.primary_diagnosis}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium uppercase tracking-wider ${
                        scan.risk_level === 'high' ? 'bg-destructive/10 text-destructive' : 
                        scan.risk_level === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {scan.risk_level} Risk
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(scan.scanned_at), 'PPP')}</span>
                      <span>{scan.confidence_rate}% Confidence</span>
                    </div>
                    {scan.user_accuracy_feedback && (
                      <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${
                        scan.user_accuracy_feedback === 'accurate' ? 'text-emerald-600' : 'text-destructive'
                      }`}>
                        {scan.user_accuracy_feedback === 'accurate' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        Verified {scan.user_accuracy_feedback}
                      </div>
                    )}
                  </div>
                  
                  <Button variant="outline" size="sm" className="gap-2" disabled={openingPdfId === scan.id} onClick={(e) => { e.stopPropagation(); void handleOpenPdf(scan); }}>
                    <FileText className="w-4 h-4" /> {openingPdfId === scan.id ? 'Opening...' : 'Open PDF'}
                  </Button>
                </div>
                
                {/* Expanded Details */}
                {expandedScan === scan.id && (
                  <div className="border-t border-border p-6 bg-muted/20">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold mb-3">ABCDE Metrics</h4>
                        <div className="space-y-2">
                          {Object.entries(scan.abcde_metrics || {}).map(([key, val]: [string, any]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="font-medium">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <SymptomLogger scanId={scan.id} initialNotes={scan.user_notes} />
                      </div>
                    </div>
                    <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-sm">Was this scan accurate?</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {scan.user_accuracy_feedback === 'accurate'
                            ? 'Marked as accurate.'
                            : scan.user_accuracy_feedback === 'inaccurate'
                              ? 'Marked as inaccurate.'
                              : 'Your response helps improve future screening analytics.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={scan.user_accuracy_feedback === 'accurate' ? 'default' : 'outline'}
                          disabled={savingFeedbackId === scan.id || Boolean(scan.user_accuracy_feedback)}
                          aria-pressed={scan.user_accuracy_feedback === 'accurate'}
                          onClick={() => void handleAccuracyFeedback(scan.id, 'accurate')}
                          className="gap-2"
                        >
                          <Check className="w-4 h-4" /> Accurate
                        </Button>
                        <Button
                          size="sm"
                          variant={scan.user_accuracy_feedback === 'inaccurate' ? 'destructive' : 'outline'}
                          disabled={savingFeedbackId === scan.id || Boolean(scan.user_accuracy_feedback)}
                          aria-pressed={scan.user_accuracy_feedback === 'inaccurate'}
                          onClick={() => void handleAccuracyFeedback(scan.id, 'inaccurate')}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" /> Inaccurate
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
