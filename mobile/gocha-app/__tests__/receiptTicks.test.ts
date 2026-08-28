import { receiptTicks } from '../src/chat/receiptTicks';

describe('receiptTicks', () => {
  it('uses one gray check for sent', () => {
    expect(receiptTicks('sent')).toEqual({ icon: 'checkmark', tone: 'muted' });
  });

  it('uses one highlighted check for delivered', () => {
    expect(receiptTicks('delivered')).toEqual({ icon: 'checkmark', tone: 'highlight' });
  });

  it('uses two highlighted checks for read', () => {
    expect(receiptTicks('read')).toEqual({ icon: 'checkmark-done', tone: 'highlight' });
  });

  it('hides ticks when status is missing', () => {
    expect(receiptTicks(undefined)).toBeNull();
  });
});
