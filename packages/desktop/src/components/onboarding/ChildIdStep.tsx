// src/components/onboarding/ChildIdStep.tsx
import { useState } from 'react';
import { Button } from '../ui/Button';

interface ChildIdStepProps {
  onNext: (childId: string, childName?: string) => void;
  onBack: () => void;
  initialChildId?: string;
}

export function ChildIdStep({ onNext, onBack, initialChildId = '' }: ChildIdStepProps) {
  const [childId, setChildId] = useState(initialChildId);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    if (!childId.trim()) {
      setError('Please enter a Child ID');
      return;
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(childId.trim())) {
      setError('Invalid Child ID format. It should look like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
      return;
    }

    setError(null);
    setIsValidating(true);

    try {
      // Test connection with this child ID first
      const result = await window.electronAPI.testConnection(childId.trim());
      
      if (!result.connected) {
        setError(result.message || 'Could not verify this Child ID. Please check and try again.');
        setIsValidating(false);
        return;
      }

      // Save the child ID
      await window.electronAPI.setChildId(childId.trim());
      
      // Extract child name from message if available
      const childNameMatch = result.message?.match(/Child: (.+?)(\s|$)/);
      const childName = childNameMatch ? childNameMatch[1] : undefined;
      
      onNext(childId.trim(), childName);
    } catch (err) {
      setError('Failed to save Child ID. Please try again.');
      console.error('Error saving child ID:', err);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="max-w-lg w-full animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Enter Child ID
        </h2>
        <p className="text-muted-foreground">
          This links the app to your child's profile
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-card rounded-xl p-4 mb-6 shadow-sm">
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Where to find your Child ID:
        </h3>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-medium text-primary">1.</span>
            <span>Open the PlaySense parent dashboard in your browser</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-primary">2.</span>
            <span>Go to <strong>Settings</strong> page</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-primary">3.</span>
            <span>Find your child's device card</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-primary">4.</span>
            <span>Click <strong>Copy</strong> next to the Child ID</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-primary">5.</span>
            <span>Paste it below</span>
          </li>
        </ol>
      </div>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Child ID
        </label>
        <input
          type="text"
          value={childId}
          onChange={(e) => {
            setChildId(e.target.value);
            setError(null);
          }}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className={`w-full px-4 py-3 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm ${
            error ? 'border-red-500' : 'border-border'
          }`}
          autoFocus
        />
        {error && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleNext}
        disabled={isValidating || !childId.trim()}
        className="w-full py-4 text-lg font-semibold"
      >
        {isValidating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Verifying...
          </span>
        ) : (
          'Continue'
        )}
      </Button>

      {/* Help */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        Don't have a Child ID yet?{' '}
        <a
          href="https://playsense.app/dashboard/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Create one on the dashboard
        </a>
      </p>
    </div>
  );
}
