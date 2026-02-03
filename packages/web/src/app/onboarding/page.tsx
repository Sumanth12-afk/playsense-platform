'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  ArrowRight, 
  ArrowLeft,
  User,
  Monitor,
  Mail,
  Check,
  Shield,
  Heart,
  BarChart3,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { COMPANION_APP_DOWNLOAD_URL } from '@/lib/constants';
import { useAddChild } from '@/hooks/useChildren';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type OnboardingStep = 'welcome' | 'child' | 'device' | 'email' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [childName, setChildName] = useState('');
  const [ageRange, setAgeRange] = useState<string>('');
  const [emailTime, setEmailTime] = useState('20:00');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const addChild = useAddChild();

  const ageRanges = ['8-10', '11-13', '14-16', '17-18'];
  const emailTimes = [
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '21:00', label: '9:00 PM' },
  ];

  const nextStep = async () => {
    const steps: OnboardingStep[] = ['welcome', 'child', 'device', 'email', 'complete'];
    const currentIndex = steps.indexOf(step);
    
    // Save child when moving from 'child' step
    if (step === 'child' && childName && ageRange) {
      setIsSaving(true);
      try {
        await addChild.mutateAsync({ name: childName, age_range: ageRange });
        toast.success('Child profile created!');
      } catch (error) {
        toast.error('Failed to create child profile. Please try again.');
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }
    
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'child', 'device', 'email', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const downloadUrl = COMPANION_APP_DOWNLOAD_URL;

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'PlaySense-Setup.exe';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to start download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">PlaySense</span>
        </div>
      </header>

      {/* Progress Indicator */}
      {step !== 'welcome' && step !== 'complete' && (
        <div className="flex justify-center px-4">
          <div className="flex gap-2">
            {['child', 'device', 'email'].map((s, i) => (
              <div
                key={s}
                className={cn(
                  'h-2 w-12 rounded-full transition-colors',
                  step === s || ['child', 'device', 'email'].indexOf(step) > i
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg text-center"
            >
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary"
              >
                <Gamepad2 className="h-12 w-12 text-primary-foreground" />
              </motion.div>
              
              <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
                Welcome to PlaySense
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Understand your child's gaming habits with insight and respect—not surveillance.
              </p>

              <div className="mt-8 grid gap-4 text-left">
                {[
                  { icon: BarChart3, text: 'See what games they play and for how long' },
                  { icon: Heart, text: 'Get health insights based on gaming patterns' },
                  { icon: Shield, text: 'No spying, no screen capture, no control' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <Button onClick={nextStep} className="mt-8 w-full gap-2" size="lg">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {step === 'child' && (
            <motion.div
              key="child"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md w-full"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
                <User className="h-8 w-8 text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground text-center">
                Add your child
              </h2>
              <p className="mt-2 text-center text-muted-foreground">
                This helps us personalize insights for their age group
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Child's name
                  </label>
                  <Input
                    placeholder="Enter name"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Age range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {ageRanges.map((range) => (
                      <button
                        key={range}
                        onClick={() => setAgeRange(range)}
                        className={cn(
                          'rounded-xl border-2 p-4 text-center transition-all',
                          ageRange === range
                            ? 'border-primary bg-primary-light text-primary'
                            : 'border-border bg-card text-foreground hover:border-primary/50'
                        )}
                      >
                        <span className="font-semibold">{range}</span>
                        <span className="block text-sm text-muted-foreground mt-1">years old</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Button onClick={prevStep} variant="outline" className="flex-1">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={nextStep} 
                  className="flex-1"
                  disabled={!childName || !ageRange || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Continue'}
                  {!isSaving && <ArrowRight className="h-5 w-5 ml-2" />}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'device' && (
            <motion.div
              key="device"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md w-full"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground text-center">
                Connect {childName}'s PC
              </h2>
              <p className="mt-2 text-center text-muted-foreground">
                Install our lightweight app on your child's computer
              </p>

              <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold text-foreground">How it works</h3>
                <div className="mt-4 space-y-4">
                  {[
                    'Download the PlaySense companion app',
                    'Install it on your child\'s PC (requires admin)',
                    'The app runs quietly in the background',
                    'Only gaming activity data is collected',
                  ].map((stepText, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {i + 1}
                      </div>
                      <span className="text-sm text-muted-foreground">{stepText}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="mt-6 w-full gap-2" 
                  variant="outline"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download for Windows
                    </>
                  )}
                </Button>
              </div>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Don't have access right now? You can do this later in Settings.
              </p>

              <div className="mt-6 flex gap-3">
                <Button onClick={prevStep} variant="outline" className="flex-1">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Continue
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md w-full"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground text-center">
                Daily email reports
              </h2>
              <p className="mt-2 text-center text-muted-foreground">
                Get a summary of gaming activity delivered to your inbox
              </p>

              <div className="mt-8">
                <label className="block text-sm font-medium text-foreground mb-3">
                  When should we send your daily report?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {emailTimes.map((time) => (
                    <button
                      key={time.value}
                      onClick={() => setEmailTime(time.value)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all',
                        emailTime === time.value
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-border bg-card text-foreground hover:border-primary/50'
                      )}
                    >
                      {emailTime === time.value && <Check className="h-4 w-4" />}
                      <span className="font-semibold">{time.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-muted/50 p-4">
                <h4 className="font-medium text-foreground text-sm">Your daily email includes:</h4>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li>• Total gaming time for the day</li>
                  <li>• Games played with durations</li>
                  <li>• Health status (Healthy/Attention/Concern)</li>
                  <li>• Late-night gaming indicator</li>
                  <li>• One helpful tip</li>
                </ul>
              </div>

              <div className="mt-6 flex gap-3">
                <Button onClick={prevStep} variant="outline" className="flex-1">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Finish Setup
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-health-green-bg"
              >
                <Check className="h-10 w-10 text-health-green" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-foreground">
                You're all set!
              </h2>
              <p className="mt-2 text-muted-foreground">
                PlaySense is ready to help you understand {childName}'s gaming habits.
              </p>

              <div className="mt-8 rounded-2xl bg-primary-light p-6 text-left">
                <h3 className="font-semibold text-foreground">What happens next?</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• Gaming activity will appear once the companion app syncs</li>
                  <li>• Your first daily email will arrive tomorrow at {emailTimes.find(t => t.value === emailTime)?.label}</li>
                  <li>• Insights will develop as more data is collected</li>
                </ul>
              </div>

              <Button onClick={goToDashboard} className="mt-8 w-full gap-2" size="lg">
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
