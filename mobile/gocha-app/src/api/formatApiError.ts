import { ApiError } from './client';

export function formatApiError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  if (error.body.errors) {
    const fieldMessage = Object.values(error.body.errors).flat()[0];
    if (fieldMessage) {
      return fieldMessage;
    }
  }

  if (error.body.correlationId) {
    return `${error.message} (id: ${error.body.correlationId})`;
  }

  return error.message;
}
