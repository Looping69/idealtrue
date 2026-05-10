import React, { useEffect, useState } from 'react';
import { Loader2, MessageSquareText, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { getMyHostQuickReplies, saveMyHostQuickReplies } from '@/lib/messaging-client';
import type { HostQuickReplySettings } from '@/types';

type ReplyField = {
  key: keyof Pick<HostQuickReplySettings, 'checkin' | 'checkout' | 'paymentInfo' | 'directions' | 'houseRules'>;
  label: string;
  description: string;
  placeholder: string;
};

const replyFields: ReplyField[] = [
  {
    key: 'houseRules',
    label: 'House rules',
    description: 'Used by the House Rules quick action before and after confirmation.',
    placeholder: 'No parties. Quiet hours from 22:00. No smoking indoors. Pets by written approval only.',
  },
  {
    key: 'directions',
    label: 'Directions',
    description: 'Used when sending arrival directions for a confirmed stay.',
    placeholder: 'Use the side gate on Ocean Road. Park in bay 4 and ring the bell marked Cottage.',
  },
  {
    key: 'paymentInfo',
    label: 'Payment info',
    description: 'Used when nudging guests to pay or clarify payment details in chat.',
    placeholder: 'Please pay by EFT, use the booking reference, and upload proof of payment in this chat.',
  },
  {
    key: 'checkin',
    label: 'Check-in instructions',
    description: 'Available for stay coordination once payment is confirmed.',
    placeholder: 'Check-in is from 14:00. Send your arrival time on the day and I will meet you at reception.',
  },
  {
    key: 'checkout',
    label: 'Checkout instructions',
    description: 'Available for departure coordination.',
    placeholder: 'Checkout is by 10:00. Leave keys in the lockbox and message me once you have left.',
  },
];

const emptySettings: HostQuickReplySettings = {
  checkin: '',
  checkout: '',
  paymentInfo: '',
  directions: '',
  houseRules: '',
};

export default function HostQuickReplies() {
  const [settings, setSettings] = useState<HostQuickReplySettings>(emptySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getMyHostQuickReplies()
      .then((quickReplies) => {
        if (!cancelled) {
          setSettings({ ...emptySettings, ...quickReplies });
        }
      })
      .catch((error) => {
        console.error('Failed to load host quick replies:', error);
        toast.error('Could not load your quick replies.');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (key: ReplyField['key'], value: string) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const saved = await saveMyHostQuickReplies(settings);
      setSettings({ ...emptySettings, ...saved });
      toast.success('Quick replies saved.');
    } catch (error) {
      console.error('Failed to save host quick replies:', error);
      toast.error('Could not save quick replies.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          <MessageSquareText className="h-3.5 w-3.5" />
          Message system
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quick replies</h1>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
            Prefill the host-side message actions with your real operating copy. Empty fields fall back to safe generic text.
          </p>
        </div>
      </header>

      <Card className="p-6 sm:p-8">
        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSave}>
            {replyFields.map((field) => (
              <div key={field.key} className="grid gap-3 border-b border-outline-variant pb-6 last:border-b-0 last:pb-0 lg:grid-cols-[14rem_1fr]">
                <div className="space-y-1">
                  <Label htmlFor={`quick-reply-${field.key}`}>{field.label}</Label>
                  <p className="text-xs leading-relaxed text-on-surface-variant">{field.description}</p>
                </div>
                <textarea
                  id={`quick-reply-${field.key}`}
                  value={settings[field.key] ?? ''}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="min-h-[112px] w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-sm leading-relaxed outline-none transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}

            <div className="flex justify-end border-t border-outline-variant pt-6">
              <Button type="submit" disabled={isSaving} className="min-w-36 rounded-full">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save replies
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
