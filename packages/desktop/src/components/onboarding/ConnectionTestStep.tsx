// src/components/onboarding/ConnectionTestStep.tsx
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

interface ConnectionTestStepProps {
  childId: string;
  onSuccess: () => void;
  onRetry: () => void;
}

type ConnectionStatus = 'testing' | 'success' | 'error';

export function ConnectionTestStep({ childId, onSuccess, onRetry }: ConnectionTestStepProps) {
  const [status, setStatus] = useState<ConnectionStatus>('testing');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    runConnectionTest();
  }, []);

  const runConnectionTest = async () => {
    setStatus('testing');
    setProgress(0);
    
    // Simulate progress stages
    const stages = [
      { progress: 20, label: 'Connecting to server...' },
      { progress: 50, label: 'Verifying Child ID...' },
      { progress: 80, label: 'Testing sync capability...' },
      { progress: 100, label: 'Finalizing...' },
    ];

    try {
      // Run through stages with small delays for visual feedback
      for (const stage of stages) {
        setProgress(stage.progress);
        setMessage(stage.label);
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // Actually test connection
      const result = await window.electronAPI.testConnection(childId);
      
      if (result.connected) {
        setStatus('success');
        setMessage(result.message || 'Connection successful!');
        
        // Auto-advance after success
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setStatus('error');
        setMessage(result.message || 'Connection failed. Please check your Child ID and internet connection.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Connection test failed. Please try again.');
      console.error('Connection test error:', err);
    }
  };

  return (
    <div className="max-w-lg w-full text-center animate-fadeIn">
      {/* Status Icon */}
      <div className="mb-8">
        {status === 'testing' && (
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
        )}
        {status === 'success' && (
          <div className="w-24 h-24 mx-auto rounded-full bg-green-500/10 flex items-center justify-center animate-scaleIn">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="w-24 h-24 mx-auto rounded-full bg-red-500/10 flex items-center justify-center animate-scaleIn">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {status === 'testing' && 'Testing Connection'}
        {status === 'success' && 'Connection Successful!'}
        {status === 'error' && 'Connection Failed'}
      </h2>

      {/* Message */}
      <p className={`mb-6 ${status === 'error' ? 'text-red-500' : 'text-muted-foreground'}`}>
        {message}
      </p>

      {/* Progress Bar (only during testing) */}
      {status === 'testing' && (
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-8">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Child ID Display */}
      <div className="bg-card rounded-xl p-4 mb-6">
        <p className="text-sm text-muted-foreground mb-1">Testing with Child ID:</p>
        <code className="text-xs font-mono text-foreground break-all">{childId}</code>
      </div>

      {/* Actions */}
      {status === 'success' && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Proceeding to next step...
        </p>
      )}

      {status === 'error' && (
        <div className="space-y-3">
          <Button onClick={runConnectionTest} className="w-full py-3">
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </span>
          </Button>
          <Button onClick={onRetry} variant="secondary" className="w-full py-3">
            Change Child ID
          </Button>
        </div>
      )}
    </div>
  );
}
