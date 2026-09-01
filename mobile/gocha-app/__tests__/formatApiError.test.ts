import { ApiError } from '../src/api/client';
import { formatApiError } from '../src/api/formatApiError';

describe('formatApiError', () => {
  it('appends the correlation id from a 500 body', () => {
    const error = new ApiError(
      {
        code: 'INTERNAL',
        message:
          'The server could not complete the request. Retry or contact support with the correlation id.',
        correlationId: 'corr-create-group',
      },
      500,
    );

    expect(formatApiError(error, 'Could not create group.')).toBe(
      'The server could not complete the request. Retry or contact support with the correlation id. (id: corr-create-group)',
    );
  });

  it('prefers the first field message on validation errors', () => {
    const error = new ApiError(
      {
        code: 'VALIDATION',
        message: 'The given data was invalid.',
        errors: { google_place_id: ['Select a suggested address from Google.'] },
      },
      422,
    );

    expect(formatApiError(error, 'Could not create group.')).toBe(
      'Select a suggested address from Google.',
    );
  });

  it('uses the fallback when the value is not an ApiError', () => {
    expect(formatApiError(new Error('boom'), 'Could not create group.')).toBe(
      'Could not create group.',
    );
  });
});
