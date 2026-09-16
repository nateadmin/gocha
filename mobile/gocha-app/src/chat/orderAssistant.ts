export const ORDER_ASSISTANT_CHAT_ID = 'gocha-ai';

export const ORDER_ASSISTANT_DEFAULT_NAME = 'Gocha AI';

export const ORDER_ASSISTANT_SUGGESTIONS = [
  'What can you help me with?',
  'Plan my week',
  'Write a friendly reply',
  'Find something fun nearby',
];

export function isOrderAssistantChat(chatId: string): boolean {
  return chatId === ORDER_ASSISTANT_CHAT_ID;
}
