import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabaseClient';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

export function PdfVault() {
  const { user } = useAuth();
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) loadPdfs();
  }, [user]);

  const loadPdfs = async () => {
    setIsLoading(true);
    // Find all scans that have a pdf_report_url, joining on lesions to ensure they belong to user
    const { data: lesionsData } = await supabase
      .from('lesions')
      .select('id')
      .eq('user_id', user?.id);

    if (lesionsData && lesionsData.length > 0) {
      const lesionIds = lesionsData.map(l => l.id);
      
      const { data } = await supabase
        .from('scans')
        .select('*, lesions(nickname, body_location)')
        .in('lesion_id', lesionIds)
        .not('pdf_report_url', 'is', null)
        .order('scanned_at', { ascending: false });

      setPdfs(data || []);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">PDF Vault</h1>
        <p className="text-muted-foreground mt-1">Access all your generated clinical reports</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : pdfs.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
          <p className="text-muted-foreground mb-6">When you scan a lesion, you can generate a PDF report that will be saved here.</p>
        </div>
      ) : (
        <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3}}>
          <Masonry gutter="1.5rem">
            {pdfs.map(scan => (
              <div key={scan.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center border-b border-border">
                  <FileText className="w-12 h-12 text-primary/40" />
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold leading-tight flex-1">{scan.primary_diagnosis}</h3>
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ml-2 flex-shrink-0 ${
                      scan.risk_level === 'high' ? 'bg-destructive/10 text-destructive' : 
                      scan.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {scan.risk_level} Risk
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(scan.scanned_at), 'PPP')}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Profile:</span> <span className="font-medium text-foreground">{scan.lesions?.nickname}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full gap-2" 
                    variant="default"
                    onClick={() => window.open(scan.pdf_report_url, '_blank')}
                  >
                    <Download className="w-4 h-4" /> View Report
                  </Button>
                </div>
              </div>
            ))}
          </Masonry>
        </ResponsiveMasonry>
      )}
    </div>
  );
}
