import { useState } from 'react';
import type { Booking, Listing } from '@/types';

export function useAppShellState() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedListingForDetail, setSelectedListingForDetail] = useState<Listing | null>(null);
  const [bookingToReview, setBookingToReview] = useState<Booking | null>(null);
  const [selectedBookingForChat, setSelectedBookingForChat] = useState<Booking | null>(null);
  const [bookingForPaymentProof, setBookingForPaymentProof] = useState<Booking | null>(null);

  return {
    isMenuOpen,
    setIsMenuOpen,
    selectedListingForDetail,
    setSelectedListingForDetail,
    bookingToReview,
    setBookingToReview,
    selectedBookingForChat,
    setSelectedBookingForChat,
    bookingForPaymentProof,
    setBookingForPaymentProof,
  };
}
