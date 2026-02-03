// src/components/onboarding/AdminSetupStep.tsx
import { useState } from 'react';
import { Button } from '../ui/Button';

interface AdminSetupStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function AdminSetupStep({ onComplete, onSkip }: AdminSetupStepProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 4) {
      return 'Password must be at least 4 characters';
    }
    if (pwd.length > 50) {
      return 'Password must be less than 50 characters';
    }
    return null;
  };

  const handleSetup = async () => {
    setError(null);

    // Validate password
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSaving(true);

    try {
      // Save the admin password using the dedicated admin credentials handler
      // This stores it in the Windows registry for security
      const result = await window.electronAPI.setAdminCredentials(password);
      
      if (!result.success) {
        setError(result.error || 'Failed to save admin credentials');
        return;
      }
      
      onComplete();
    } catch (err) {
      setError('Failed to save admin credentials. Please try again.');
      console.error('Error saving admin credentials:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: '', color: '', width: '0%' };
    if (pwd.length < 4) return { label: 'Too short', color: 'bg-red-500', width: '20%' };
    if (pwd.length < 6) return { label: 'Weak', color: 'bg-orange-500', width: '40%' };
    if (pwd.length < 8) return { label: 'Fair', color: 'bg-yellow-500', width: '60%' };
    if (pwd.length < 12) return { label: 'Good', color: 'bg-green-500', width: '80%' };
    return { label: 'Strong', color: 'bg-green-600', width: '100%' };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="max-w-lg w-full animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Set Admin Password
        </h2>
        <p className="text-muted-foreground">
          This password protects the app from being uninstalled or modified
        </p>
      </div>

      {/* Explanation */}
      <div className="bg-card rounded-xl p-4 mb-6 shadow-sm">
        <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          Why set an admin password?
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Prevents accidental or unauthorized uninstallation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Required to change settings or stop the app</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Keeps gaming insights accurate and continuous</span>
          </li>
        </ul>
      </div>

      {/* Password Input */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Admin Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Enter a secure password"
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-12"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Password Strength */}
          {password && (
            <div className="mt-2">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className={`text-xs mt-1 ${strength.color.replace('bg-', 'text-')}`}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            placeholder="Re-enter password"
            className={`w-full px-4 py-3 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-border'
            }`}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleSetup}
          disabled={isSaving || !password || !confirmPassword || password !== confirmPassword}
          className="w-full py-4 text-lg font-semibold"
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Setting up...
            </span>
          ) : (
            'Set Password & Continue'
          )}
        </Button>

        <Button
          onClick={onSkip}
          variant="ghost"
          className="w-full py-3 text-muted-foreground"
        >
          Skip for now (not recommended)
        </Button>
      </div>

      {/* Note */}
      <p className="text-xs text-center text-muted-foreground mt-4">
        Keep this password safe! You'll need it to uninstall or modify PlaySense.
      </p>
    </div>
  );
}
