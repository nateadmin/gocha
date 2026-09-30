/**
 * Hermes throws RangeError when toLocale*String is called with [].
 * Always pass undefined for the locale and fall back if Intl is incomplete.
 */

const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: 'numeric',
  day: 'numeric',
  year: '2-digit',
};
const SHORT_DATE_OPTS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
const LONG_DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
};

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const LONG_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function fallbackClockTime(date: Date): string {
  const hours = date.getHours();
  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hour12}:${pad2(date.getMinutes())} ${suffix}`;
}

function fallbackNumericDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;
}

function fallbackShortMonthDay(date: Date): string {
  return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function fallbackLongDate(date: Date): string {
  return `${LONG_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatWithLocale(
  date: Date,
  kind: 'time' | 'date',
  options: Intl.DateTimeFormatOptions,
  fallback: (value: Date) => string,
): string {
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  try {
    return kind === 'time'
      ? date.toLocaleTimeString(undefined, options)
      : date.toLocaleDateString(undefined, options);
  } catch {
    return fallback(date);
  }
}

export function formatClockTime(date: Date): string {
  return formatWithLocale(date, 'time', TIME_OPTS, fallbackClockTime);
}

export function formatNumericDate(date: Date): string {
  return formatWithLocale(date, 'date', DATE_OPTS, fallbackNumericDate);
}

export function formatShortMonthDay(date: Date): string {
  return formatWithLocale(date, 'date', SHORT_DATE_OPTS, fallbackShortMonthDay);
}

export function formatLongDate(date: Date): string {
  return formatWithLocale(date, 'date', LONG_DATE_OPTS, fallbackLongDate);
}

export function formatActivityLabel(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const nowDate = new Date(now);
  const isToday =
    date.getDate() === nowDate.getDate() &&
    date.getMonth() === nowDate.getMonth() &&
    date.getFullYear() === nowDate.getFullYear();
  return isToday ? formatClockTime(date) : formatNumericDate(date);
}

export function formatIsoClockTime(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  return formatClockTime(new Date(iso));
}

export function formatIsoNumericDate(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  return formatNumericDate(new Date(iso));
}
