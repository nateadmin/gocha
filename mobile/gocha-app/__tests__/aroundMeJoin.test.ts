/**
 * @format
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('Around Me request to join calls the join-request API', () => {
  const source = readFileSync(
    join(__dirname, '../src/screens/discover/AroundMeScreen.tsx'),
    'utf8',
  );
  expect(source).toContain('requestJoinCommunityGroup');
  expect(source).toContain('onPress={() => handleJoin(group)}');
  expect(source).toContain('Approve');
});
