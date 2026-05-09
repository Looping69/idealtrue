import { useEffect, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Booking, Listing } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { serializeImageFile, type SerializedImageAsset } from "@/lib/media-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentProofDialogProps {
  booking: Booking | null;
  listing?: Listing | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (params: { id: string; paymentReference: string; paymentProof: SerializedImageAsset | null }) => Promise<void>;
}

export default function PaymentProofDialog({
  booking,
  listing,
  open,
  onClose,
  onSubmit,
}: PaymentProofDialogProps) {
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProof, setPaymentProof] = useState<SerializedImageAsset | null>(null);
  const [paymentProofName, setPaymentProofName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!booking) {
      setPaymentReference("");
      setPaymentProof(null);
      setPaymentProofName("");
      setIsSubmitting(false);
      return;
    }

    setPaymentReference(booking.paymentReference ?? "");
    setPaymentProof(null);
    setPaymentProofName("");
  }, [booking]);

  async function handleProofFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const serialized = await serializeImageFile(file, {
        maxDimension: 1600,
        maxBytes: 450 * 1024,
        fallbackName: 'payment-proof',
      });
      setPaymentProof(serialized);
      setPaymentProofName(file.name);
    } finally {
      event.target.value = "";
    }
  }

  async function handleSubmit() {
    if (!booking) return;

    const trimmedReference = paymentReference.trim();
    if (!trimmedReference) {
      return;
    }
    if (!paymentProof) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: booking.id,
        paymentReference: trimmedReference,
        paymentProof,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Submit Payment Proof</DialogTitle>
          <DialogDescription>
            {listing
              ? `Upload a private receipt image and the payment reference for ${listing.title}.`
              : "Submit a private receipt image and the payment reference the host can match against their account."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {booking?.paymentInstructions && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Host Payment Instructions
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-on-surface">
                {booking.paymentInstructions}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="payment-reference">Payment reference</Label>
            <Input
              id="payment-reference"
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
              placeholder="Example: IDEAL-BOOKING-4821"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label>Proof of payment</Label>
            <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-on-surface">
                    Upload a screenshot or receipt image
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    JPG, PNG, or WEBP work best. We compress it before upload so the host can review it cleanly.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container">
                  <ImagePlus className="h-4 w-4" />
                  Choose file
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleProofFileChange}
                  />
                </label>
              </div>

              {paymentProofName && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm">
                  <span className="truncate text-on-surface">{paymentProofName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentProof(null);
                      setPaymentProofName("");
                    }}
                    className="ml-3 rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                    aria-label="Remove uploaded proof"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-on-surface-variant">
              Upload a receipt image. External proof links are no longer accepted because hosts must review evidence stored inside Ideal Stay's private proof flow.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !paymentReference.trim() || !paymentProof}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit proof"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
