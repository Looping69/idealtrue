import type { Booking, InquiryState } from '@/types';

type BookingStateSlice = Pick<Booking, 'inquiryState' | 'paymentState' | 'paymentSubmittedAt' | 'paymentConfirmedAt'>;
type HostBookingSlice = BookingStateSlice & Pick<Booking, 'createdAt' | 'viewedAt' | 'respondedAt' | 'paymentUnlockedAt' | 'bookedAt' | 'expiresAt'>;
type BookingDeadlineSlice = BookingStateSlice & Pick<Booking, 'expiresAt'>;

export type HostInquiryBucket =
  | 'needs_response'
  | 'awaiting_guest_payment'
  | 'payment_review'
  | 'confirmed'
  | 'closed';

export type InquiryDeadlineState =
  | { kind: 'response_due' | 'payment_due' | 'confirmation_due' | 'expired'; deadlineAt: string }
  | null;

export function getInquiryDisplayState(booking: BookingStateSlice): InquiryState {
  if (booking.inquiryState === 'APPROVED' && booking.paymentState === 'COMPLETED') {
    return 'BOOKED';
  }

  return booking.inquiryState;
}

export function getInquiryBadgeLabel(booking: BookingStateSlice) {
  if (isAwaitingHostPaymentConfirmation(booking)) {
    return 'Payment Under Review';
  }

  const state = getInquiryDisplayState(booking);

  switch (state) {
    case 'PENDING':
      return 'Awaiting Host Response';
    case 'VIEWED':
      return 'Viewed';
    case 'RESPONDED':
      return 'Responded';
    case 'APPROVED':
      return 'Ready for Payment';
    case 'DECLINED':
      return 'Declined';
    case 'EXPIRED':
      return 'Expired';
    case 'BOOKED':
      return 'BOOKED';
    default:
      return state;
  }
}

export function getInquiryResponseText(booking: BookingStateSlice) {
  if (isAwaitingHostPaymentConfirmation(booking)) {
    return 'Payment proof submitted. Awaiting host confirmation';
  }

  const state = getInquiryDisplayState(booking);

  switch (state) {
    case 'PENDING':
      return 'Awaiting host response';
    case 'VIEWED':
      return 'Host has viewed your inquiry';
    case 'RESPONDED':
      return 'Host responded to your inquiry';
    case 'APPROVED':
      return 'Ready for payment';
    case 'DECLINED':
      return 'This inquiry was declined';
    case 'EXPIRED':
      return 'This inquiry expired';
    case 'BOOKED':
      return 'Confirmed stay';
    default:
      return state;
  }
}

export function canGuestPay(booking: BookingStateSlice) {
  return booking.inquiryState === 'APPROVED' && booking.paymentState === 'INITIATED' && !booking.paymentSubmittedAt;
}

export function canGuestViewStayDetails(booking: BookingStateSlice) {
  return booking.inquiryState === 'BOOKED' && booking.paymentState === 'COMPLETED';
}

export function isBookedStay(booking: BookingStateSlice) {
  return booking.inquiryState === 'BOOKED' && booking.paymentState === 'COMPLETED';
}

export function isAwaitingHostPaymentConfirmation(booking: BookingStateSlice) {
  return booking.inquiryState === 'APPROVED' && booking.paymentState === 'INITIATED' && !!booking.paymentSubmittedAt && !booking.paymentConfirmedAt;
}

export function isAwaitingGuestPayment(booking: BookingStateSlice) {
  return booking.inquiryState === 'APPROVED' && booking.paymentState === 'INITIATED' && !booking.paymentSubmittedAt;
}

export function getInquiryDeadlineState(booking: BookingDeadlineSlice): InquiryDeadlineState {
  if (!booking.expiresAt) {
    return null;
  }

  if (booking.inquiryState === 'EXPIRED') {
    return { kind: 'expired', deadlineAt: booking.expiresAt };
  }

  if (isPendingHostDecision(booking)) {
    return { kind: 'response_due', deadlineAt: booking.expiresAt };
  }

  if (booking.inquiryState === 'APPROVED' && booking.paymentState === 'INITIATED') {
    return {
      kind: booking.paymentSubmittedAt ? 'confirmation_due' : 'payment_due',
      deadlineAt: booking.expiresAt,
    };
  }

  return null;
}

export function getHostInquiryBucket(booking: HostBookingSlice): HostInquiryBucket {
  if (isAwaitingHostPaymentConfirmation(booking)) {
    return 'payment_review';
  }

  if (isBookedStay(booking)) {
    return 'confirmed';
  }

  if (isPendingHostDecision(booking)) {
    return 'needs_response';
  }

  if (isAwaitingGuestPayment(booking) || booking.inquiryState === 'APPROVED') {
    return 'awaiting_guest_payment';
  }

  return 'closed';
}

export function getHostInquirySortTimestamp(booking: HostBookingSlice) {
  switch (getHostInquiryBucket(booking)) {
    case 'payment_review':
      return booking.paymentSubmittedAt ?? booking.paymentUnlockedAt ?? booking.createdAt;
    case 'awaiting_guest_payment':
      return booking.paymentUnlockedAt ?? booking.respondedAt ?? booking.createdAt;
    case 'confirmed':
      return booking.paymentConfirmedAt ?? booking.bookedAt ?? booking.createdAt;
    case 'closed':
      return booking.expiresAt ?? booking.respondedAt ?? booking.viewedAt ?? booking.createdAt;
    case 'needs_response':
    default:
      return booking.respondedAt ?? booking.viewedAt ?? booking.createdAt;
  }
}

export function isOpenHostInquiry(booking: Pick<Booking, 'inquiryState'>) {
  return ['PENDING', 'VIEWED', 'RESPONDED', 'APPROVED'].includes(booking.inquiryState);
}

export function isPendingHostDecision(booking: Pick<Booking, 'inquiryState'>) {
  return ['PENDING', 'VIEWED', 'RESPONDED'].includes(booking.inquiryState);
}
