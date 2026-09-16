import type { StringKey } from '../i18n/strings';

type Translate = (key: StringKey) => string;

export function formatTypingLabel(names: string[], t: Translate): string {
  const trimmed = names.map((name) => name.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return '';
  }
  if (trimmed.length === 1) {
    return t('chat.typingOne').replace('{name}', trimmed[0]);
  }
  if (trimmed.length === 2) {
    return t('chat.typingTwo')
      .replace('{name1}', trimmed[0])
      .replace('{name2}', trimmed[1]);
  }

  return t('chat.typingMany');
}
