import type { ChatMessage, ChatRecord } from './types';

export type DisappearingOverride = number | null | undefined;

export function effectiveDisappearingTimerSec(
  override: DisappearingOverride,
  defaultSec: number | null,
): number | null {
  if (override === undefined) {
    return defaultSec;
  }
  return override;
}

export function effectiveDisappearingTimerForChat(
  chat: ChatRecord | undefined,
  defaultSec: number | null,
): number | null {
  if (!chat) {
    return defaultSec;
  }
  return effectiveDisappearingTimerSec(chat.disappearingOverride, defaultSec);
}

export function formatDurationLabel(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }
  if (seconds < 86400) {
    const hours = Math.round(seconds / 3600);
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  const days = Math.round(seconds / 86400);
  return days === 1 ? '1 day' : `${days} days`;
}

export function formatDurationLabelShort(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`;
  }
  if (seconds < 86400) {
    return `${Math.round(seconds / 3600)} hr`;
  }
  return `${Math.round(seconds / 86400)} day`;
}

export function disappearingOverrideLabel(override: DisappearingOverride): string {
  if (override === undefined) {
    return 'Use account default';
  }
  if (override === null) {
    return 'Off';
  }
  return formatDurationLabel(override);
}

export function disappearingSettingSummary(
  override: DisappearingOverride,
  defaultSec: number | null,
): string {
  if (override === undefined) {
    if (defaultSec === null) {
      return 'Use account default (Off)';
    }
    return `Use account default (${formatDurationLabel(defaultSec)})`;
  }
  if (override === null) {
    return 'Off for this chat';
  }
  return formatDurationLabel(override);
}

export function messageExpiresAtMs(sentAtMs: number, timerSec: number): number {
  return sentAtMs + timerSec * 1000;
}

export function isMessageExpired(message: ChatMessage, now = Date.now()): boolean {
  return message.expiresAtMs != null && message.expiresAtMs <= now;
}

export function filterExpiredMessages(messages: ChatMessage[], now = Date.now()): ChatMessage[] {
  return messages.filter((message) => !isMessageExpired(message, now));
}

export function applyDisappearingToMessage(
  message: ChatMessage,
  timerSec: number | null,
): ChatMessage {
  if (!timerSec || timerSec <= 0) {
    return message;
  }

  const sentAtMs = message.sentAtMs ?? Date.now();
  return {
    ...message,
    selfDestructSec: timerSec,
    expiresAtMs: messageExpiresAtMs(sentAtMs, timerSec),
  };
}
