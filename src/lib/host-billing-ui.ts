import type { HostBillingAccount } from '@/types';

export type HostBillingUrgencyTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface HostBillingTimelinePresentation {
  countdownLabel: string;
  urgencyLabel: string;
  urgencyTone: HostBillingUrgencyTone;
  actionLabel: string;
  reminderLabel: string;
  periodLabel: string;
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function formatDistanceLabel(targetAt: string, now: Date) {
  const target = new Date(targetAt);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 'now';
  }

  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  if (diffMs >= dayMs) {
    const days = Math.ceil(diffMs / dayMs);
    return `${days} day${days === 1 ? '' : 's'}`;
  }

  const hours = Math.max(1, Math.ceil(diffMs / hourMs));
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

function formatReminderLabel(reminderCount: number) {
  return `${reminderCount} reminder${reminderCount === 1 ? '' : 's'} sent`;
}

export function getHostBillingTimelinePresentation(
  account: HostBillingAccount | null | undefined,
  nowInput: string | Date = new Date(),
): HostBillingTimelinePresentation {
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput);

  if (!account) {
    return {
      countdownLabel: 'Billing timeline unavailable',
      urgencyLabel: 'Waiting on billing setup',
      urgencyTone: 'neutral',
      actionLabel: 'Redeem a voucher or choose a paid plan to start hosting billing.',
      reminderLabel: '0 reminders sent',
      periodLabel: 'Free hosting period not started',
    };
  }

  const periodStart = formatDateLabel(account.currentPeriodStart);
  const periodEnd = formatDateLabel(account.currentPeriodEnd);
  const reminderStart = formatDateLabel(account.reminderWindowStartsAt);
  const reminderLabel = formatReminderLabel(account.reminderCount);
  const isVoucherHost = account.billingSource === 'voucher';

  const periodLabel = isVoucherHost
    ? periodStart && periodEnd
      ? `Free hosting period: ${periodStart} to ${periodEnd}`
      : periodEnd
        ? `Free hosting period ends on ${periodEnd}`
        : 'Free hosting period not started'
    : periodStart && periodEnd
      ? `Current billing cycle: ${periodStart} to ${periodEnd}`
      : 'Billing cycle dates unavailable';

  if (account.billingStatus === 'greylisted') {
    return {
      countdownLabel: 'Listings paused for billing follow-up',
      urgencyLabel: 'Greylisted',
      urgencyTone: 'danger',
      actionLabel: account.greylistReason || 'Add a billing card so admin can clear the greylist.',
      reminderLabel,
      periodLabel,
    };
  }

  if (account.greylistEligible || account.nextAction === 'greylist') {
    return {
      countdownLabel: 'Greylist can happen now',
      urgencyLabel: 'Overdue',
      urgencyTone: 'danger',
      actionLabel: 'Add a billing card now to stop your account from being paused.',
      reminderLabel,
      periodLabel,
    };
  }

  if (account.cardOnFile || account.nextAction === 'none') {
    return {
      countdownLabel: account.billingSource === 'paid' && periodEnd ? `Renews on ${periodEnd}` : 'Billing card on file',
      urgencyLabel: isVoucherHost ? 'Protected' : 'Active',
      urgencyTone: 'success',
      actionLabel: isVoucherHost ? 'Your billing card is saved. Greylist reminders stop here.' : 'No billing action required right now.',
      reminderLabel,
      periodLabel,
    };
  }

  if (account.inReminderWindow && account.nextAction === 'add_card') {
    const distance = account.currentPeriodEnd ? formatDistanceLabel(account.currentPeriodEnd, now) : null;

    return {
      countdownLabel: distance ? `Greylist in ${distance}` : 'Reminder window active',
      urgencyLabel: 'Final reminder window',
      urgencyTone: 'warning',
      actionLabel: periodEnd
        ? `Add a billing card before ${periodEnd} to keep your listings live.`
        : 'Add a billing card now to keep your listings live.',
      reminderLabel,
      periodLabel,
    };
  }

  if (account.nextAction === 'add_card') {
    const distance = account.reminderWindowStartsAt ? formatDistanceLabel(account.reminderWindowStartsAt, now) : null;

    return {
      countdownLabel: distance ? `Reminder window starts in ${distance}` : 'Billing card still required',
      urgencyLabel: 'Card still missing',
      urgencyTone: 'neutral',
      actionLabel: periodEnd
        ? `Add a billing card before ${periodEnd} so greylist reminders never start.`
        : 'Add a billing card before the free hosting period ends.',
      reminderLabel,
      periodLabel: reminderStart ? `${periodLabel} · Reminders begin ${reminderStart}` : periodLabel,
    };
  }

  if (account.nextAction === 'redeem_voucher') {
    return {
      countdownLabel: 'Voucher not redeemed',
      urgencyLabel: 'Setup incomplete',
      urgencyTone: 'neutral',
      actionLabel: 'Redeem your host voucher to start the free hosting period.',
      reminderLabel,
      periodLabel,
    };
  }

  if (account.nextAction === 'choose_plan') {
    return {
      countdownLabel: 'Paid plan required',
      urgencyLabel: 'Billing setup incomplete',
      urgencyTone: 'warning',
      actionLabel: 'Choose a paid plan to keep hosting access active.',
      reminderLabel,
      periodLabel,
    };
  }

  return {
    countdownLabel: periodEnd ? `Next billing checkpoint: ${periodEnd}` : 'Billing timeline active',
    urgencyLabel: 'Watching',
    urgencyTone: 'neutral',
    actionLabel: 'Review your billing setup.',
    reminderLabel,
    periodLabel,
  };
}
