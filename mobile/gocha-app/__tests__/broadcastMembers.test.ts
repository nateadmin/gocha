/**
 * @format
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('New broadcast create screen can add and remove people', () => {
  const source = readFileSync(
    join(__dirname, '../src/screens/chats/NewBroadcastScreen.tsx'),
    'utf8',
  );
  expect(source).toContain('MemberPicker');
  expect(source).toContain('createBroadcast');
  expect(source).toContain('onRemove');
  expect(source).not.toContain('Add subscribers from the broadcast chat');
  expect(source).toContain('private chat');
});

test('broadcast threads do not offer reply on the list', () => {
  const source = readFileSync(
    join(__dirname, '../src/screens/chats/ChatDetailScreen.tsx'),
    'utf8',
  );
  expect(source).toContain('chat.isBroadcast');
  expect(source).toMatch(/isBroadcast[\s\S]{0,80}\? \[\]/);
});

test('Chat info can add and remove broadcast recipients', () => {
  const source = readFileSync(
    join(__dirname, '../src/screens/chats/ChatInfoScreen.tsx'),
    'utf8',
  );
  expect(source).toContain('addBroadcastMember');
  expect(source).toContain('removeBroadcastMember');
  expect(source).toContain('RECIPIENTS');
});
