import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, Gift, CheckCircle, XCircle } from 'lucide-react';

interface RewardsGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export function RewardsGuideModal({ open, onClose }: RewardsGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Coins className="h-6 w-6 text-yellow-600" />
            How the Reward System Works
          </DialogTitle>
          <DialogDescription>
            A positive reinforcement system to encourage healthy gaming habits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* How Children Earn Points */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-600" />
              How Children Earn Points
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <span className="text-lg">🎁</span>
                <div>
                  <p className="font-medium">Welcome Bonus: 50 points</p>
                  <p className="text-muted-foreground">One-time bonus for getting started</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <span className="text-lg">🎯</span>
                <div>
                  <p className="font-medium">Complete Goals: 50 points</p>
                  <p className="text-muted-foreground">When weekly gaming goals are met</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <span className="text-lg">🏆</span>
                <div>
                  <p className="font-medium">Earn Achievements: 25 points</p>
                  <p className="text-muted-foreground">For balanced gaming, variety, etc.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <span className="text-lg">⭐</span>
                <div>
                  <p className="font-medium">Parent Bonus: Custom</p>
                  <p className="text-muted-foreground">You can award bonus points anytime</p>
                </div>
              </div>
            </div>
          </div>

          {/* How Redemption Works */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              How Redemption Works
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">
                  1
                </div>
                <div>
                  <p className="font-medium">Child browses rewards</p>
                  <p className="text-muted-foreground">
                    They can see what's available and how many points needed
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">
                  2
                </div>
                <div>
                  <p className="font-medium">Child redeems a reward</p>
                  <p className="text-muted-foreground">
                    Points are deducted and request is created
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">
                  3
                </div>
                <div>
                  <p className="font-medium">You receive the request</p>
                  <p className="text-muted-foreground">
                    It appears in "Pending Redemptions" on your dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">
                  4
                </div>
                <div>
                  <p className="font-medium">You approve or deny</p>
                  <p className="text-muted-foreground">
                    Add optional notes explaining your decision
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">
                  5
                </div>
                <div>
                  <p className="font-medium">Outcome</p>
                  <p className="text-muted-foreground">
                    <CheckCircle className="inline h-4 w-4 text-green-600 mr-1" />
                    Approved: Reward is granted
                    <br />
                    <XCircle className="inline h-4 w-4 text-red-600 mr-1" />
                    Denied: Points are automatically refunded
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Available Rewards */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Default Rewards</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-muted rounded">
                <p className="font-medium">⏰ Extra 30 Min (100 pts)</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="font-medium">⏱️ Extra 1 Hour (200 pts)</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="font-medium">🎮 New Game (500 pts)</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="font-medium">🌙 Late Night (150 pts)</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="font-medium">🎉 Weekend Bonus (250 pts)</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="font-medium">👨‍👩‍👧 Game Night (300 pts)</p>
              </div>
            </div>
          </div>

          {/* Key Points */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">💡 Key Points</h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>
                • You have <strong>full control</strong> - approve or deny every request
              </li>
              <li>
                • Points are <strong>automatically refunded</strong> if you deny
              </li>
              <li>
                • This encourages <strong>positive behavior</strong>, not just restriction
              </li>
              <li>
                • Children become <strong>partners</strong> in managing their gaming
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Got it!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
