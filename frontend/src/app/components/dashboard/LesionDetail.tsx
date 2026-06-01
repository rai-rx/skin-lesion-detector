import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../../../services/supabaseClient';
import { ArrowLeft, Camera, Activity, Calendar, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SymptomLogger } from './SymptomLogger';
import { format } from 'date-fns';

export function LesionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [expandedScan, setExpandedScan] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProfileAndScans();
    }
  }, [id]);

  const loadProfileAndScans = async () => {
    // 1. Load Profile
    const { data: profileData } = await supabase
      .from('lesions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (profileData) setProfile(profileData);

    // 2. Load Scans
    const { data: scansData } = await supabase
      .from('scans')
      .select('*')
      .eq('lesion_id', id)
      .order('scanned_at', { ascending: true }); // chronological

    if (scansData) {
      // Reverse for list display (newest first)
      setScans([...scansData].reverse());

      // Prepare chart data (chronological)
      const dataForChart = scansData.map(s => ({
        date: format(new Date(s.scanned_at), 'MMM dd, yy'),
        confidence: s.confidence_rate,
        diagnosis: s.primary_diagnosis,
        risk: s.risk_level
      }));
      setChartData(dataForChart);
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
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">{profile.nickname}</h1>
            <p className="text-muted-foreground mt-1">Location: {profile.body_location}</p>
          </div>
        </div>
        
        <Button onClick={() => navigate('/scan', { state: { lesion_id: profile.id } })} className="gap-2">
          <Camera className="w-4 h-4" /> New Scan for this Profile
        </Button>
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
                  </div>
                  
                  {scan.pdf_report_url && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); window.open(scan.pdf_report_url, '_blank'); }}>
                      <FileText className="w-4 h-4" /> PDF
                    </Button>
                  )}
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
