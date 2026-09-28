import { memo, useLayoutEffect, useRef, useState } from 'react';

import { fetchAppMeta } from '../../api/client';
import { preparePhoneRecaptcha, RECAPTCHA_HOST_ID } from '../../auth/phoneFirebase';
import { BrandText } from '../brand/BrandText';

export const RecaptchaSlot = memo(function RecaptchaSlot() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    let host = document.getElementById(RECAPTCHA_HOST_ID);
    if (!host) {
      host = document.createElement('div');
      host.id = RECAPTCHA_HOST_ID;
    }
    if (host.parentElement !== mount) {
      mount.appendChild(host);
    }

    let cancelled = false;
    void fetchAppMeta()
      .then((meta) => {
        if (cancelled) {
          return;
        }
        if (!meta.auth.firebase) {
          setError('Phone sign-in is not configured yet.');
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
      <div ref={mountRef} style={{ minHeight: 78, display: 'flex', justifyContent: 'center' }} />
      {error ? (
        <BrandText style={{ textAlign: 'center', marginTop: 8 }}>{error}</BrandText>
      ) : null}
    </div>
  );
});
