'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Gamepad2, 
  ArrowRight, 
  BarChart3, 
  Heart, 
  Shield, 
  MessageCircleHeart,
  Moon,
  Flame,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Game Activity Dashboard',
      description: 'See what games your child plays and how long they spend on each one.',
    },
    {
      icon: Heart,
      title: 'Healthy Gaming Score',
      description: 'A holistic score based on session patterns, not just total hours played.',
    },
    {
      icon: Moon,
      title: 'Sleep Impact Insights',
      description: 'Understand how late-night gaming may be affecting rest and focus.',
    },
    {
      icon: Flame,
      title: 'Burnout Detection',
      description: 'Identify patterns that might indicate gaming fatigue or burnout.',
    },
    {
      icon: MessageCircleHeart,
      title: 'Conversation Guidance',
      description: 'Research-backed tips for discussing gaming with your child.',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'No screenshots, no keylogging, no chat monitoring. Just insights.',
    },
  ];

  const notFeatures = [
    'Screen capture or recording',
    'Keystroke logging',
    'Chat or message monitoring',
    'Remote viewing or control',
    'Blocking or forced shutdowns',
    'Hidden surveillance',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Gamepad2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">PlaySense</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-2 mb-6"
          >
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Insight, not intrusion</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
          >
            Understand your child's gaming,{' '}
            <span className="text-primary">respectfully</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            PlaySense helps parents see gaming habits without spying. Get insights that reduce conflict and build trust—not walls.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/register">
              <Button size="lg" className="gap-2 text-lg px-8">
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Demo
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground">
              Everything you need to understand gaming habits
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Get meaningful insights without crossing privacy boundaries. PlaySense gives you the information you need to have informed, caring conversations.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-card p-6 shadow-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Don't Do */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-primary-light p-8 lg:p-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">What PlaySense never does</h2>
            </div>
            <p className="text-muted-foreground mb-8">
              We believe monitoring should respect your child's dignity. Here's what we will never do:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {notFeatures.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-lg bg-card p-4"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-health-green-bg">
                    <Check className="h-4 w-4 text-health-green" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-foreground">
              Ready to understand, not control?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start getting insights that help you have better conversations with your child about gaming.
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="mt-8 gap-2 text-lg px-8">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Gamepad2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">PlaySense</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Helping families understand gaming together
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
