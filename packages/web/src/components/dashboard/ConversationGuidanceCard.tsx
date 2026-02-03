import { motion } from 'framer-motion';
import { MessageCircleHeart, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

interface GuidanceTip {
  topic: string;
  whatToSay: string;
  whatNotToSay: string;
  context: string;
}

interface ConversationGuidanceCardProps {
  tips: GuidanceTip[];
  compact?: boolean;
}

export const ConversationGuidanceCard = ({
  tips,
  compact = false,
}: ConversationGuidanceCardProps) => {
  const displayTips = compact ? tips.slice(0, 2) : tips;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
          <MessageCircleHeart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Conversation Starters</h3>
          <p className="text-sm text-muted-foreground">Based on this week's patterns</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {displayTips.map((tip, index) => (
          <motion.div
            key={tip.topic}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            className="rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-foreground">{tip.topic}</span>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-health-green-bg">
                  <CheckCircle className="h-3 w-3 text-health-green" />
                </div>
                <div>
                  <span className="text-xs font-medium text-health-green uppercase tracking-wide">
                    Try saying
                  </span>
                  <p className="mt-0.5 text-sm text-foreground italic">"{tip.whatToSay}"</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-health-red-bg">
                  <XCircle className="h-3 w-3 text-health-red" />
                </div>
                <div>
                  <span className="text-xs font-medium text-health-red uppercase tracking-wide">
                    Avoid saying
                  </span>
                  <p className="mt-0.5 text-sm text-foreground italic">"{tip.whatNotToSay}"</p>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-muted/50 p-2">
              <p className="text-xs text-muted-foreground">{tip.context}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
