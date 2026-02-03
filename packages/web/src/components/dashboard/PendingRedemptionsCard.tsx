import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePendingRedemptions, useReviewRedemption } from '@/hooks/useRewards';
import { CheckCircle, XCircle, Loader2, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function PendingRedemptionsCard() {
  const { data: pendingRedemptions, isLoading } = usePendingRedemptions();
  const reviewMutation = useReviewRedemption();
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!pendingRedemptions || pendingRedemptions.length === 0) {
    return null;
  }

  const handleReview = async (redemptionId: string, approved: boolean) => {
    await reviewMutation.mutateAsync({
      redemptionId,
      approved,
      notes: notes[redemptionId],
    });
    setNotes((prev) => {
      const newNotes = { ...prev };
      delete newNotes[redemptionId];
      return newNotes;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-foreground">
            Pending Reward Requests ({pendingRedemptions.length})
          </h3>
        </div>

        <div className="space-y-4">
          {pendingRedemptions.map((redemption) => (
            <div key={redemption.id} className="p-4 bg-background rounded-lg border border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">
                    {redemption.child?.name} wants to redeem:
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl">{redemption.reward?.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {redemption.reward?.reward_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {redemption.points_spent} points
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Requested {new Date(redemption.requested_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {redemption.reward?.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {redemption.reward.description}
                </p>
              )}

              <Textarea
                placeholder="Add a note (optional)"
                value={notes[redemption.id] || ''}
                onChange={(e) => setNotes((prev) => ({ ...prev, [redemption.id]: e.target.value }))}
                className="mb-3"
                rows={2}
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReview(redemption.id, true)}
                  disabled={reviewMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                >
                  {reviewMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReview(redemption.id, false)}
                  disabled={reviewMutation.isPending}
                  className="flex-1 gap-2"
                >
                  {reviewMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Deny
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
