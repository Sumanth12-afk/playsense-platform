// src/components/onboarding/OnboardingWizard.tsx
// NOTE: Admin password setup is handled by native dialog after child ID is saved
import { useState } from 'react';
import { WelcomeStep } from './WelcomeStep';
import { ChildIdStep } from './ChildIdStep';
import { ConnectionTestStep } from './ConnectionTestStep';
import { CompletionStep } from './CompletionStep';

// Admin step removed - handled by native dialog
export type OnboardingStep = 'welcome' | 'child-id' | 'connection' | 'complete';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [childId, setChildId] = useState('');
  const [childName, setChildName] = useState('');

  // Admin step removed - native dialog handles it
  const steps: OnboardingStep[] = ['welcome', 'child-id', 'connection', 'complete'];
  const currentIndex = steps.indexOf(currentStep);

  const goToNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goToPrevious = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleChildIdSaved = (id: string, name?: string) => {
    setChildId(id);
    if (name) setChildName(name);
    goToNext();
  };

  const handleConnectionSuccess = () => {
    // After connection success, go to complete
    // Native dialog for admin password will appear separately
    goToNext();
  };

  const handleConnectionRetry = () => {
    setCurrentStep('child-id');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col">
      {/* Progress Bar */}
      <div className="h-1 bg-muted w-full">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center gap-2 pt-6 pb-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index <= currentIndex 
                ? 'bg-primary scale-110' 
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {currentStep === 'welcome' && (
          <WelcomeStep onNext={goToNext} />
        )}
        {currentStep === 'child-id' && (
          <ChildIdStep 
            onNext={handleChildIdSaved} 
            onBack={goToPrevious}
            initialChildId={childId}
          />
        )}
        {currentStep === 'connection' && (
          <ConnectionTestStep 
            childId={childId}
            onSuccess={handleConnectionSuccess}
            onRetry={handleConnectionRetry}
          />
        )}
        {currentStep === 'complete' && (
          <CompletionStep 
            childName={childName || 'your child'}
            onFinish={onComplete}
          />
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-6 text-xs text-muted-foreground">
        PlaySense Companion v1.0.0
      </div>
    </div>
  );
}
