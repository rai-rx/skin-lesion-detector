import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Loader2, Check } from 'lucide-react';

interface SymptomLoggerProps {
  scanId: string;
  initialNotes?: string;
}

export function SymptomLogger({ scanId, initialNotes = '' }: SymptomLoggerProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Debounced save effect
  useEffect(() => {
    if (notes === initialNotes) return;
    
    setStatus('saving');
    const timer = setTimeout(async () => {
      const { error } = await supabase
        .from('scans')
        .update({ user_notes: notes })
        .eq('id', scanId);
        
      if (error) {
        setStatus('error');
      } else {
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [notes, scanId, initialNotes]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={`notes-${scanId}`} className="font-semibold text-base">Symptom Notes</Label>
        <div className="text-sm text-muted-foreground flex items-center gap-1 min-w-[70px] justify-end">
          {status === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>}
          {status === 'saved' && <><Check className="w-3 h-3 text-green-500" /> Saved</>}
          {status === 'error' && <span className="text-destructive text-xs">Failed</span>}
        </div>
      </div>
      <Textarea
        id={`notes-${scanId}`}
        placeholder="Log any physical changes, e.g., itching, bleeding, change in size..."
        className="min-h-[120px] bg-background resize-y"
        value={notes || ''}
        onChange={(e) => setNotes(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">Changes are saved automatically.</p>
    </div>
  );
}
