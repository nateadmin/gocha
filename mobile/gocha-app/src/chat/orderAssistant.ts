export const ORDER_ASSISTANT_CHAT_ID = 'book-chat-order';

export const ORDER_ASSISTANT_DEFAULT_NAME = 'Book, Chat & Order';

export const ORDER_ASSISTANT_SUGGESTIONS = [
  'Order me lunch 🥗',
  'Get my usual coffee ☕',
  'Groceries for dinner tonight 🛒',
  'I need a ride to the airport 🚕',
];

export function isOrderAssistantChat(chatId: string): boolean {
  return chatId === ORDER_ASSISTANT_CHAT_ID;
}
