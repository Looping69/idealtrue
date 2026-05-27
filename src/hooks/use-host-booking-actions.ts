import { useState } from 'react';
import { toast } from 'sonner';

import type { Booking } from '@/types';
import { extractPlatformErrorMessage } from '@/lib/platform-errors';
import { getInquiryDeclineReasonDetail } from '@/lib/inquiry-state';
import { confirmPayment, markInquiryViewed, updateBookingStatus } from '@/lib/platform-client';

type UseHostBookingActionsOptions = {
  onBookingUpdated: (booking: Booking) => void;
  onChat: (booking: Booking) => void;
  onAfterApprove?: (booking: Booking) => void;
  onAfterDecline?: (booking: Booking) => void;
  onAfterConfirmPayment?: (booking: Booking) => void;
};

export function useHostBookingActions({
  onBookingUpdated,
  onChat,
  onAfterApprove,
  onAfterDecline,
  onAfterConfirmPayment,
}: UseHostBookingActionsOptions) {
  const [isProcessingBookingId, setIsProcessingBookingId] = useState<string | null>(null);
  const [decliningBooking, setDecliningBooking] = useState<Booking | null>(null);

  async function approveBooking(booking: Booking) {
    setIsProcessingBookingId(booking.id);
    try {
      const updatedBooking = await updateBookingStatus(booking.id, 'APPROVED');
      onBookingUpdated(updatedBooking);
      onAfterApprove?.(updatedBooking);
      toast.success('Inquiry approved. Payment is now unlocked for the guest.');
    } catch (error) {
      console.error('Failed to approve inquiry:', error);
      toast.error(extractPlatformErrorMessage(error, 'Failed to approve inquiry.'));
    } finally {
      setIsProcessingBookingId(null);
    }
  }

  async function declineBooking(payload: {
    declineReason: Booking['declineReason'];
    declineReasonNote?: string | null;
  }) {
    if (!decliningBooking || !payload.declineReason) {
      return;
    }

    setIsProcessingBookingId(decliningBooking.id);
    try {
      const updatedBooking = await updateBookingStatus(decliningBooking.id, 'DECLINED', payload);
      onBookingUpdated(updatedBooking);
      onAfterDecline?.(updatedBooking);
      toast.info(
        getInquiryDeclineReasonDetail(updatedBooking)
          ? `Inquiry declined: ${getInquiryDeclineReasonDetail(updatedBooking)}.`
          : 'Inquiry declined.',
      );
      setDecliningBooking(null);
    } catch (error) {
      console.error('Failed to decline inquiry:', error);
      toast.error(extractPlatformErrorMessage(error, 'Failed to decline inquiry.'));
    } finally {
      setIsProcessingBookingId(null);
    }
  }

  async function confirmBookingPayment(booking: Booking) {
    setIsProcessingBookingId(booking.id);
    try {
      const updatedBooking = await confirmPayment(booking.id);
      onBookingUpdated(updatedBooking);
      onAfterConfirmPayment?.(updatedBooking);
      toast.success('Payment confirmed. The stay is now booked.');
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast.error(extractPlatformErrorMessage(error, 'Failed to confirm payment.'));
    } finally {
      setIsProcessingBookingId(null);
    }
  }

  async function openInquiryChat(booking: Booking) {
    setIsProcessingBookingId(booking.id);
    try {
      const nextBooking = booking.inquiryState === 'PENDING'
        ? await markInquiryViewed(booking.id)
        : booking;

      if (nextBooking !== booking) {
        onBookingUpdated(nextBooking);
      }

      onChat(nextBooking);
    } catch (error) {
      console.error('Failed to open inquiry chat:', error);
      toast.error(extractPlatformErrorMessage(error, 'Failed to open the guest conversation.'));
    } finally {
      setIsProcessingBookingId((current) => (current === booking.id ? null : current));
    }
  }

  return {
    approveBooking,
    confirmBookingPayment,
    declineBooking,
    decliningBooking,
    isProcessingBookingId,
    openInquiryChat,
    setDecliningBooking,
  };
}
