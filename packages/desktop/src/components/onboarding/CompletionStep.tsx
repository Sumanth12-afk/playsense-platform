// src/components/onboarding/CompletionStep.tsx
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

interface CompletionStepProps {
  childName: string;
  onFinish: () => void;
}

export function CompletionStep({ childName, onFinish }: CompletionStepProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleRunInBackground = async () => {
    try {
      // Mark setup as complete
      await window.electronAPI.setSetting('setup_complete', 'true');
      
      // Hide to tray
      await window.electronAPI.hideToTray();
    } catch (err) {
      console.error('Error hiding to tray:', err);
      // Still finish even if hide fails
      onFinish();
    }
  };

  const handleOpenDashboard = async () => {
    try {
      // Mark setup as complete
      await window.electronAPI.setSetting('setup_complete', 'true');
      onFinish();
    } catch (err) {
      console.error('Error completing setup:', err);
      onFinish();
    }
  };

  return (
    <div className="max-w-lg w-full text-center animate-fadeIn relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
              }}
            />
          ))}
        </div>
      )}

      {/* Success Icon */}
      <div className="mb-8 relative z-10">
        <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25 animate-bounceIn">
          <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-foreground mb-2 relative z-10">
        All Set!
      </h2>
      <p className="text-lg text-muted-foreground mb-8 relative z-10">
        PlaySense is now monitoring {childName}'s gaming activity
      </p>

      {/* Summary Card */}
      <div className="bg-card rounded-2xl p-6 mb-8 shadow-lg text-left relative z-10">
        <h3 className="font-semibold text-foreground mb-4">What happens next:</h3>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm">🎮</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Game Detection</p>
              <p className="text-sm text-muted-foreground">
                The app will automatically detect when games are played
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm">☁️</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Auto Sync</p>
              <p className="text-sm text-muted-foreground">
                Data syncs to your parent dashboard every minute
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm">🔔</span>
            </div>
            <div>
              <p className="font-medium text-foreground">System Tray</p>
              <p className="text-sm text-muted-foreground">
                Find the PS icon in your system tray to open this dashboard
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-3 relative z-10">
        <Button
          onClick={handleRunInBackground}
          className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run in Background
          </span>
        </Button>

        <Button
          onClick={handleOpenDashboard}
          variant="secondary"
          className="w-full py-3"
        >
          Open Dashboard
        </Button>
      </div>

      {/* Tip */}
      <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20 relative z-10">
        <p className="text-sm text-foreground">
          <strong>Tip:</strong> The app will start automatically when the computer turns on.
          Check your parent dashboard for gaming insights!
        </p>
      </div>

      {/* Confetti Styles */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -20px;
          animation: confetti-fall 3s ease-out forwards;
          border-radius: 2px;
        }
        
        @keyframes bounceIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-bounceIn {
          animation: bounceIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
