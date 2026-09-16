import { buildGochaAiHistory } from '../src/chat/gochaAiApi';
import type { ChatMessage } from '../src/chat/types';

describe('buildGochaAiHistory', () => {
  it('maps recent text messages to user and assistant roles', () => {
    const messages: ChatMessage[] = [
      {
        id: 'welcome',
        type: 'text',
        text: 'Hi. I am Gocha AI.',
        sentAt: 'Now',
        isOutgoing: false,
      },
      {
        id: 'u1',
        type: 'text',
        text: 'Plan my week',
        sentAt: 'Now',
        isOutgoing: true,
      },
      {
        id: 'a1',
        type: 'text',
        text: 'Here is a simple plan.',
        sentAt: 'Now',
        isOutgoing: false,
      },
    ];

    expect(buildGochaAiHistory(messages)).toEqual([
      { role: 'assistant', content: 'Hi. I am Gocha AI.' },
      { role: 'user', content: 'Plan my week' },
      { role: 'assistant', content: 'Here is a simple plan.' },
    ]);
  });
});
