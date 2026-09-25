import { useEffect, useState } from 'react';

import { fetchAppMeta } from '../../api/client';
import {
  preparePhoneRecaptcha,
  RECAPTCHA_HOST_ID,
} from '../../auth/phoneFirebase';
import { BrandText } from '../brand/BrandText';

export function RecaptchaSlot() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchAppMeta()
      .then((meta) => {
        if (cancelled || !meta.auth.firebase) {
          return;
        }
        return preparePhoneRecaptcha(meta.auth.firebase);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load the robot check.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <BrandText muted style={{ textAlign: 'center', marginBottom: 8 }}>
        Check the box to confirm you are not a robot, then send the code.
      </BrandText>
      <div id={RECAPTCHA_HOST_ID} style={{ minHeight: 78, display: 'flex', justifyContent: 'center' }} />
      {error ? (
        <BrandText style={{ textAlign: 'center', marginTop: 8 }}>{error}</BrandText>
      ) : null}
    </div>
  );
}
