import { postGochaAiChat, type GochaAiHistoryItem } from '../api/client';
import type { ChatMessage } from './types';

const MAX_HISTORY = 20;

export function buildGochaAiHistory(messages: ChatMessage[]): GochaAiHistoryItem[] {
  return messages
    .filter((message) => message.type === 'text' && Boolean(message.text?.trim()))
    .slice(-MAX_HISTORY)
    .map((message) => ({
      role: message.isOutgoing ? 'user' : 'assistant',
      content: message.text!.trim(),
    }));
}

export async function sendGochaAiMessage(message: string, messages: ChatMessage[]): Promise<string> {
  const history = buildGochaAiHistory(messages);
  const payload = await postGochaAiChat(message, history);
  return payload.reply.trim();
}
