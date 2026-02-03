'use client';

import { motion } from 'framer-motion';
import { ConversationGuidanceCard } from '@/components/dashboard/ConversationGuidanceCard';
import { useConversationTips, transformTipsForCard } from '@/hooks/useConversationTips';
import { Heart, Shield, MessageSquare, Users } from 'lucide-react';

const GuidancePage = () => {
  const { data: conversationTips, isLoading } = useConversationTips();
  const conversationGuidance = transformTipsForCard(conversationTips);

  const principles = [
    {
      icon: Heart,
      title: 'Lead with Curiosity',
      description: 'Ask open-ended questions about what they enjoy, rather than interrogating about time spent.',
    },
    {
      icon: Shield,
      title: 'Avoid Shame',
      description: 'Gaming is a normal hobby. Frame concerns around health and balance, not addiction or weakness.',
    },
    {
      icon: MessageSquare,
      title: 'Listen First',
      description: 'Understand their perspective before sharing your concerns. They may have valid reasons for their patterns.',
    },
    {
      icon: Users,
      title: 'Partner Together',
      description: 'Work with your child to set boundaries they agree with, rather than imposing rules unilaterally.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
          Conversation Guidance
        </h1>
        <p className="mt-2 text-muted-foreground">
          Research-backed tips for having supportive conversations about gaming
        </p>
      </motion.div>

      {/* Principles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card p-6 shadow-card"
      >
        <h2 className="text-lg font-semibold text-foreground">Core Principles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep these in mind when discussing gaming habits
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {principles.map((principle, index) => (
            <motion.div
              key={principle.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex gap-4 rounded-xl border border-border p-4"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light">
                <principle.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{principle.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{principle.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Personalized Guidance */}
      {isLoading ? (
        <div className="rounded-2xl bg-card p-6 shadow-card animate-pulse">
          <div className="h-6 w-48 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-3/4 bg-muted rounded"></div>
          </div>
        </div>
      ) : conversationGuidance.length > 0 ? (
        <ConversationGuidanceCard tips={conversationGuidance} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card p-6 shadow-card text-center"
        >
          <p className="text-muted-foreground">
            No personalized tips available yet. Tips will appear here based on your child&apos;s gaming patterns.
          </p>
        </motion.div>
      )}

      {/* Additional Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-primary-light p-6"
      >
        <h2 className="text-lg font-semibold text-foreground">Remember</h2>
        <p className="mt-2 text-muted-foreground">
          Gaming is a normal part of childhood today. Most children who play video games
          do not develop problems. The goal isn&apos;t to eliminate gaming, but to help your
          child develop a healthy relationship with it—just like we help them develop
          healthy relationships with food, exercise, and other activities.
        </p>
        <p className="mt-3 text-sm text-primary font-medium">
          When you show genuine interest in what your child enjoys, it opens doors for
          meaningful conversations about balance and wellbeing.
        </p>
      </motion.div>
    </div>
  );
};

export default GuidancePage;
