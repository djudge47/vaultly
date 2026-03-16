'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyButton } from '@/components/shared/copy-button';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { AiAnalysis } from '@/types';

interface ScriptPanelProps {
  subscriptionId: string;
  analysis: AiAnalysis | null;
  onScriptsGenerated?: (analysis: AiAnalysis) => void;
}

export function ScriptPanel({ subscriptionId, analysis, onScriptsGenerated }: ScriptPanelProps) {
  const [loading, setLoading] = useState(false);
  const [localAnalysis, setLocalAnalysis] = useState(analysis);

  const hasScripts = localAnalysis?.cancellation_email;

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Merge scripts into analysis
      const updated = { ...localAnalysis, ...data.scripts } as AiAnalysis;
      setLocalAnalysis(updated);
      onScriptsGenerated?.(updated);
      toast.success('Scripts generated!');
    } catch (err) {
      toast.error('Failed to generate scripts');
    } finally {
      setLoading(false);
    }
  }

  if (!hasScripts) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Generate Scripts</h3>
          <p className="text-sm text-muted-foreground mt-1">
            AI will write personalized cancellation, negotiation, phone, and chat scripts for this subscription.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Scripts</>}
        </Button>
      </div>
    );
  }

  const scripts = [
    { id: 'cancel', label: 'Cancel Email', content: localAnalysis?.cancellation_email },
    { id: 'negotiate', label: 'Negotiate', content: localAnalysis?.negotiation_email },
    { id: 'phone', label: 'Phone Script', content: localAnalysis?.phone_script },
    { id: 'chat', label: 'Chat Script', content: localAnalysis?.chat_script },
  ];

  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4">
      <h3 className="font-semibold">Scripts</h3>
      <Tabs defaultValue="cancel">
        <TabsList className="w-full grid grid-cols-4">
          {scripts.map(s => (
            <TabsTrigger key={s.id} value={s.id} className="text-xs">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {scripts.map(s => (
          <TabsContent key={s.id} value={s.id} className="mt-3">
            <div className="relative">
              <pre className="bg-muted rounded-xl p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed text-foreground overflow-auto max-h-64">
                {s.content ?? 'Script not available'}
              </pre>
              <div className="mt-2 flex justify-end">
                <CopyButton text={s.content ?? ''} />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
