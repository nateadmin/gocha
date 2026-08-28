import { useEffect, useState } from 'react';

import type { OtpAuthMode } from '../../api/client';
import { useAccounts } from '../context/AccountsContext';
import { consumeStartSignIn } from '../profileCards/postAuthIntent';
import { AuthWelcomeScreen } from '../screens/auth/AuthWelcomeScreen';
import { EmailScreen } from '../screens/auth/EmailScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';

type Step = 'welcome' | 'email' | 'otp';

export function AuthNavigator() {
  const { isAddingAccount, cancelAddAccount } = useAccounts();
  const [step, setStep] = useState<Step>('welcome');
  const [mode, setMode] = useState<OtpAuthMode>('signin');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isAddingAccount) {
      setStep('email');
      setMode('signup');
      return;
    }
    if (consumeStartSignIn()) {
      setMode('signin');
      setStep('email');
    }
  }, [isAddingAccount]);

  function handleAuthBack() {
    if (isAddingAccount) {
      cancelAddAccount();
      return;
    }
    setStep('welcome');
  }

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
        onBack={handleAuthBack}
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
