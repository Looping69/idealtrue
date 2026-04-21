import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { inquiryDeclineReasonOptions } from '@/lib/inquiry-state';
import type { InquiryDeclineReason } from '@/types';

type InquiryDeclineDialogProps = {
  bookingLabel: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (payload: { declineReason: InquiryDeclineReason; declineReasonNote?: string | null }) => Promise<void> | void;
  open: boolean;
};

export default function InquiryDeclineDialog({
  bookingLabel,
  isSubmitting = false,
  onClose,
  onConfirm,
  open,
}: InquiryDeclineDialogProps) {
  const [declineReason, setDeclineReason] = useState<InquiryDeclineReason>('DATES_UNAVAILABLE');
  const [declineReasonNote, setDeclineReasonNote] = useState('');

  useEffect(() => {
    if (!open) {
      setDeclineReason('DATES_UNAVAILABLE');
      setDeclineReasonNote('');
    }
  }, [open]);

  const selectedReason = useMemo(
    () => inquiryDeclineReasonOptions.find((option) => option.value === declineReason) ?? inquiryDeclineReasonOptions[0],
    [declineReason],
  );
  const requiresNote = declineReason === 'OTHER';
  const trimmedNote = declineReasonNote.trim();
  const canSubmit = !requiresNote || trimmedNote.length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    await onConfirm({
      declineReason,
      declineReasonNote: trimmedNote || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Decline enquiry</DialogTitle>
          <DialogDescription>
            Pick the cleanest reason for declining {bookingLabel}. This is what guests, admins, and notifications will use.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="decline-reason">Reason</Label>
            <Select value={declineReason} onValueChange={(value) => setDeclineReason(value as InquiryDeclineReason)}>
              <SelectTrigger id="decline-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {inquiryDeclineReasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-on-surface-variant">{selectedReason.description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="decline-reason-note">
              {requiresNote ? 'Short note' : 'Optional note'}
            </Label>
            <Textarea
              id="decline-reason-note"
              value={declineReasonNote}
              onChange={(event) => setDeclineReasonNote(event.target.value)}
              placeholder={
                requiresNote
                  ? 'Add the specific reason the guest should see.'
                  : 'Add extra context only if the standard reason needs it.'
              }
              className="min-h-[120px]"
              maxLength={280}
            />
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>{requiresNote ? 'A note is required for Other.' : 'Keep it short and useful.'}</span>
              <span>{declineReasonNote.length}/280</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? 'Declining...' : 'Decline enquiry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
