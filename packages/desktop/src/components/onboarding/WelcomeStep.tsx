// src/components/onboarding/WelcomeStep.tsx
import { Button } from '../ui/Button';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="max-w-lg text-center animate-fadeIn">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse-slow">
          <span className="text-4xl font-bold text-primary-foreground">PS</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold text-foreground mb-4">
        Welcome to PlaySense
      </h1>
      <p className="text-xl text-muted-foreground mb-8">
        Your companion for mindful gaming insights
      </p>

      {/* Features */}
      <div className="bg-card rounded-2xl p-6 mb-8 text-left shadow-lg">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          What PlaySense does:
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-xl">🎮</span>
            <span className="text-muted-foreground">
              Tracks which games are played and for how long
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">📊</span>
            <span className="text-muted-foreground">
              Calculates a healthy gaming score based on patterns
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">🔒</span>
            <span className="text-muted-foreground">
              Runs quietly in the background - no interruptions
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">☁️</span>
            <span className="text-muted-foreground">
              Syncs data to the parent dashboard automatically
            </span>
          </li>
        </ul>
      </div>

      {/* Privacy Promise */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
        <p className="text-sm text-foreground font-medium mb-2">
          Our Privacy Promise
        </p>
        <p className="text-xs text-muted-foreground">
          We NEVER record keystrokes, take screenshots, monitor chats, or view screens.
          Only game names and play times are tracked.
        </p>
      </div>

      {/* CTA */}
      <Button onClick={onNext} className="w-full py-6 text-lg font-semibold">
        Get Started
      </Button>
    </div>
  );
}
