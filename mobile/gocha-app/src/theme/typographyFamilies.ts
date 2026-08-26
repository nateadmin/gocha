import { Platform } from 'react-native';

/** Traditional system UI fonts (San Francisco / Roboto). */
export const uiSansFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
}) as string;

export const uiMonoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
}) as string;

/** Web CSS font stack for react-native-web. */
export const webUiSansFamily =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const webUiMonoFamily =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
