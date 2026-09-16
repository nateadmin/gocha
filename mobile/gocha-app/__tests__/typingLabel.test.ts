import { formatTypingLabel } from '../src/chat/typingLabel';

const t = (key: string) => {
  const labels: Record<string, string> = {
    'chat.typingOne': '{name} is typing',
    'chat.typingTwo': '{name1} and {name2} are typing',
    'chat.typingMany': 'Several people are typing',
  };
  return labels[key] ?? key;
};

describe('formatTypingLabel', () => {
  it('formats one, two, and many typers', () => {
    expect(formatTypingLabel(['Gocha AI'], t)).toBe('Gocha AI is typing');
    expect(formatTypingLabel(['Alice', 'Bob'], t)).toBe('Alice and Bob are typing');
    expect(formatTypingLabel(['Alice', 'Bob', 'Carol'], t)).toBe('Several people are typing');
  });
});
