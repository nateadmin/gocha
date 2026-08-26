import { useState } from 'react';

import type { OtpAuthMode } from '../../api/client';
import { AuthWelcomeScreen } from '../screens/auth/AuthWelcomeScreen';
import { EmailScreen } from '../screens/auth/EmailScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';

type Step = 'welcome' | 'email' | 'otp';

export function AuthNavigator() {
  const [step, setStep] = useState<Step>('welcome');
  const [mode, setMode] = useState<OtpAuthMode>('signin');
  const [email, setEmail] = useState<string | null>(null);

  if (step === 'otp' && email) {
    return (
      <OtpScreen
        email={email}
        mode={mode}
        onBack={() => setStep('email')}
      />
    );
  }

  if (step === 'email') {
    return (
      <EmailScreen
        mode={mode}
        onCodeSent={(value) => {
          setEmail(value);
          setStep('otp');
        }}
        onSwitchMode={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
        }}
        onBack={() => setStep('welcome')}
      />
    );
  }

  return (
    <AuthWelcomeScreen
      onSignIn={() => {
        setMode('signin');
        setStep('email');
      }}
      onSignUp={() => {
        setMode('signup');
        setStep('email');
      }}
    />
  );
}
