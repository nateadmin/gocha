import type { MessageStatus } from './types';

export type ReceiptTickIcon = 'checkmark' | 'checkmark-done';
export type ReceiptTickTone = 'muted' | 'highlight';

export type ReceiptTicks = {
  icon: ReceiptTickIcon;
  tone: ReceiptTickTone;
};

export function receiptTicks(status?: MessageStatus): ReceiptTicks | null {
  if (!status) {
    return null;
  }

  if (status === 'read') {
    return { icon: 'checkmark-done', tone: 'highlight' };
  }

  if (status === 'delivered') {
    return { icon: 'checkmark', tone: 'highlight' };
  }

  return { icon: 'checkmark', tone: 'muted' };
}
