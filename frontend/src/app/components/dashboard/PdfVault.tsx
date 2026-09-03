import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getApiUrl, apiFetch } from '../../../services/apiUrl';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { downloadScanPdf, generateScanPdf, type ScanPdfData } from '../../../services/generatePdf';

export function PdfVault() {
  const { user, session } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user && session?.access_token) loadScans();
  }, [user, session?.access_token]);

  const loadScans = async () => {
    setIsLoading(true);

    try {
      const response = await apiFetch('/me/recent-scans', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Unable to load scans');
      const data = await response.json();
      setScans(data || []);
    } catch (error) {
      console.error('Unable to load PDF vault:', error);
      setScans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildPdfData = (scan: any): ScanPdfData => ({
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
  });

  const handleGeneratePdf = async (scan: any) => {
    setGeneratingIds(prev => new Set(prev).add(scan.id));

    try {
      const pdfData = buildPdfData(scan);
      const blob = await downloadScanPdf(pdfData, `ClinicalReport-${scan.primary_diagnosis?.replace(/\s+/g, '-') || 'Report'}.pdf`);

      // Upload to server so it's stored for future downloads
      if (session?.access_token && scan.id) {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const form = new FormData();
          form.append('scan_id', scan.id);
          form.append('file', new File([blob], `report-${scan.id}-${timestamp}.pdf`, { type: 'application/pdf' }));

          const res = await apiFetch('/reports', {
            method: 'POST',
            body: form,
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          if (res.ok) {
            const { pdf_report_url } = await res.json();
            // Update local state so the button switches to "Download"
            setScans(prev =>
              prev.map(s => (s.id === scan.id ? { ...s, pdf_report_url } : s))
            );
          }
        } catch (uploadErr) {
          console.error('PDF upload failed:', uploadErr);
        }
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(scan.id);
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div className="border-b border-[#d7d2c7] pb-8">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#2f604e]"><span className="h-2 w-2 rounded-full bg-[#2f604e]" /> Archive / clinical reports</div>
        <h1 className="font-display text-5xl font-bold leading-none text-[#24332d] md:text-6xl">PDF Vault</h1>
        <p className="mt-4 text-[#607268]">Access all your generated clinical reports</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : scans.length === 0 ? (
        <div className="mx-auto max-w-lg border-y border-[#d7d2c7] bg-[#e3ebdf] p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
          <p className="text-muted-foreground mb-6">When you scan a lesion, you can generate a PDF report that will be saved here.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#d7d2c7] border-y border-[#d7d2c7]">
          {scans.map(scan => (
            <div key={scan.id} className="group transition-colors hover:bg-[#e3ebdf]">
              <div className="flex flex-col items-start gap-5 px-3 py-7 sm:flex-row sm:items-center md:px-5">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#dce4d4]">
                  {scan.image_url ? (
                    <img src={scan.image_url} alt="Scanned lesion" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FileText className="h-8 w-8 text-[#2f604e]/50" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2">
                    <h3 className="font-display text-2xl font-bold leading-tight text-[#24332d]">{scan.primary_diagnosis}</h3>
                  </div>

                  <div className="flex flex-col gap-1 text-sm text-[#607268]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#2f604e]" />
                      <span>{format(new Date(scan.scanned_at), 'PPP p')}</span>
                    </div>
                    <div className="text-sm">
                      <span>Lesion profile: </span><span className="font-medium text-[#24332d]">{scan.lesions?.nickname || 'Unassigned profile'}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto sm:min-w-36 flex-shrink-0 flex items-center justify-center gap-3">
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    scan.risk_level === 'high' ? 'bg-destructive/10 text-destructive' : 
                    scan.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {scan.risk_level} Risk
                  </div>
                  {scan.pdf_report_url ? (
                    <Button 
                      className="gap-2" 
                      size="icon"
                      variant="default"
                      aria-label="Download PDF"
                      title="Download PDF"
                      onClick={() => window.open(scan.pdf_report_url, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      className="gap-2"
                      size="icon"
                      variant="default"
                      disabled={generatingIds.has(scan.id)}
                      aria-label={generatingIds.has(scan.id) ? 'Generating PDF' : 'Generate PDF'}
                      title={generatingIds.has(scan.id) ? 'Generating PDF' : 'Generate PDF'}
                      onClick={() => handleGeneratePdf(scan)}
                    >
                      {generatingIds.has(scan.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
