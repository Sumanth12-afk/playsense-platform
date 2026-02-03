'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-light mb-6">
        <UserPlus className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Welcome to PlaySense
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Get started by adding your child's profile. You'll be able to track their gaming activity and get insights to help guide healthy gaming habits.
      </p>
      <Link href="/onboarding">
        <Button size="lg" className="gap-2">
          Add Your First Child
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </motion.div>
  );
};

