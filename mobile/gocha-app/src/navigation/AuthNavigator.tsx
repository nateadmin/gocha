import { useState } from 'react';

import { EmailScreen } from '../screens/auth/EmailScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';

export function AuthNavigator() {
  const [email, setEmail] = useState<string | null>(null);

  if (email) {
    return <OtpScreen email={email} onBack={() => setEmail(null)} />;
  }

  return <EmailScreen onCodeSent={setEmail} />;
}
