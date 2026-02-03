import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePointsBalance, useRewards, useRedeemReward, useAwardBonusPoints, useCreateReward, useSeedDefaultRewards, useDeleteReward } from '@/hooks/useRewards';
import { Coins, Gift, Loader2, HelpCircle, Plus, Sparkles, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { RewardsGuideModal } from './RewardsGuideModal';

interface RewardsCardProps {
    childId: string;
    childName: string;
}

export function RewardsCard({ childId, childName }: RewardsCardProps) {
    const { data: pointsBalance, isLoading: balanceLoading } = usePointsBalance(childId);
    const { data: rewards, isLoading: rewardsLoading } = useRewards();
    const redeemMutation = useRedeemReward();
    const awardPointsMutation = useAwardBonusPoints();
    const createRewardMutation = useCreateReward();
    const seedDefaultsMutation = useSeedDefaultRewards();
    const deleteRewardMutation = useDeleteReward();
    const [showCatalog, setShowCatalog] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [showAwardDialog, setShowAwardDialog] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [awardAmount, setAwardAmount] = useState(10);
    const [awardReason, setAwardReason] = useState('parent_bonus');
    
    // New reward form state
    const [newReward, setNewReward] = useState({
        name: '',
        type: 'custom' as 'extra_time' | 'new_game' | 'special_privilege' | 'custom',
        description: '',
        points: 100,
        icon: '🎁',
    });

    if (balanceLoading || rewardsLoading) {
        return (
            <Card className="p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="h-20 bg-muted rounded"></div>
                </div>
            </Card>
        );
    }

    const handleRedeem = async (rewardId: string) => {
        await redeemMutation.mutateAsync({ childId, rewardId });
        setShowCatalog(false);
    };

    const handleAwardPoints = async () => {
        await awardPointsMutation.mutateAsync({
            childId,
            points: awardAmount,
            reason: awardReason,
        });
        setShowAwardDialog(false);
        setAwardAmount(10);
    };

    const handleCreateReward = async () => {
        await createRewardMutation.mutateAsync({
            rewardName: newReward.name,
            rewardType: newReward.type,
            description: newReward.description,
            pointsRequired: newReward.points,
            icon: newReward.icon,
        });
        setShowCreateDialog(false);
        setNewReward({ name: '', type: 'custom', description: '', points: 100, icon: '🎁' });
    };

    const handleSeedDefaults = async () => {
        await seedDefaultsMutation.mutateAsync();
    };

    const availableRewards = rewards?.filter(r => r.points_required <= (pointsBalance || 0)) || [];
    const upcomingRewards = rewards?.filter(r => r.points_required > (pointsBalance || 0))
        .sort((a, b) => a.points_required - b.points_required)
        .slice(0, 3) || [];
    
    const hasNoRewards = !rewards || rewards.length === 0;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            <h3 className="text-lg font-semibold text-foreground">Reward Points</h3>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowGuide(true)}
                                className="gap-1"
                            >
                                <HelpCircle className="h-4 w-4" />
                                How it works
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCatalog(true)}
                                className="gap-2"
                            >
                                <Gift className="h-4 w-4" />
                                Browse Rewards
                            </Button>
                        </div>
                    </div>

                    {/* Points Balance */}
                    <div className="mb-6 p-4 bg-background/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">{childName}'s Points</p>
                        <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                            {pointsBalance || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {availableRewards.length} rewards available
                        </p>
                        {/* Award Points Button - For Parents */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAwardDialog(true)}
                            className="mt-3 gap-2 border-yellow-400 text-yellow-700 hover:bg-yellow-100"
                        >
                            <Plus className="h-4 w-4" />
                            Award Bonus Points
                        </Button>
                    </div>

                    {/* Available Rewards */}
                    {availableRewards.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-medium text-foreground mb-2">🎁 Available Now:</p>
                            <div className="space-y-2">
                                {availableRewards.slice(0, 2).map((reward) => (
                                    <div
                                        key={reward.id}
                                        className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{reward.icon}</span>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{reward.reward_name}</p>
                                                <p className="text-xs text-muted-foreground">{reward.points_required} points</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleRedeem(reward.id)}
                                            disabled={redeemMutation.isPending}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {redeemMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Redeem'
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Rewards */}
                    {upcomingRewards.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-foreground mb-2">🎯 Coming Soon:</p>
                            <div className="space-y-2">
                                {upcomingRewards.map((reward) => {
                                    const pointsNeeded = reward.points_required - (pointsBalance || 0);
                                    return (
                                        <div
                                            key={reward.id}
                                            className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl opacity-50">{reward.icon}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{reward.reward_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Need {pointsNeeded} more points
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">{reward.points_required} pts</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {hasNoRewards ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                <Sparkles className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                                    No rewards set up yet!
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                                    Create rewards for {childName} to redeem with their points.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={handleSeedDefaults}
                                        disabled={seedDefaultsMutation.isPending}
                                        className="bg-blue-600 hover:bg-blue-700 w-full"
                                    >
                                        {seedDefaultsMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Sparkles className="h-4 w-4 mr-2" />
                                        )}
                                        Add Default Rewards
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCreateDialog(true)}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Custom Reward
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : availableRewards.length === 0 && upcomingRewards.length === 0 && (
                        <div className="text-center py-6">
                            <p className="text-sm text-muted-foreground">
                                Keep earning points to unlock rewards!
                            </p>
                        </div>
                    )}
                </Card>
            </motion.div>

            {/* Rewards Catalog Dialog */}
            <Dialog open={showCatalog} onOpenChange={setShowCatalog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Rewards Catalog</DialogTitle>
                        <DialogDescription>
                            {childName} has {pointsBalance || 0} points. Manage rewards or redeem for them.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-2 mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setShowCatalog(false);
                                setShowCreateDialog(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Reward
                        </Button>
                        {hasNoRewards && (
                            <Button
                                size="sm"
                                onClick={handleSeedDefaults}
                                disabled={seedDefaultsMutation.isPending}
                                className="gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                {seedDefaultsMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                Add Defaults
                            </Button>
                        )}
                    </div>

                    <div className="grid gap-4">
                        {rewards?.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No rewards yet. Add some rewards above!</p>
                            </div>
                        )}
                        {rewards?.map((reward) => {
                            const canAfford = (pointsBalance || 0) >= reward.points_required;
                            return (
                                <div
                                    key={reward.id}
                                    className={`p-4 rounded-lg border ${canAfford
                                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                        : 'bg-muted/50 border-border'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-3">
                                            <span className="text-3xl">{reward.icon}</span>
                                            <div>
                                                <h4 className="font-semibold text-foreground">{reward.reward_name}</h4>
                                                <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                                                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mt-2">
                                                    {reward.points_required} points
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => deleteRewardMutation.mutate(reward.id)}
                                                disabled={deleteRewardMutation.isPending}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleRedeem(reward.id)}
                                                disabled={!canAfford || redeemMutation.isPending}
                                                className={canAfford ? 'bg-green-600 hover:bg-green-700' : ''}
                                            >
                                                {redeemMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : canAfford ? (
                                                    'Redeem'
                                                ) : (
                                                    'Not enough'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Guide Modal */}
            <RewardsGuideModal open={showGuide} onClose={() => setShowGuide(false)} />

            {/* Award Points Dialog */}
            <Dialog open={showAwardDialog} onOpenChange={setShowAwardDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-yellow-600" />
                            Award Bonus Points
                        </DialogTitle>
                        <DialogDescription>
                            Give {childName} bonus points for good behavior, achievements, or just because!
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* Quick Amount Buttons */}
                        <div>
                            <label className="text-sm font-medium text-foreground">Quick Select</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {[5, 10, 25, 50, 100].map((amount) => (
                                    <Button
                                        key={amount}
                                        variant={awardAmount === amount ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setAwardAmount(amount)}
                                        className={awardAmount === amount ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                                    >
                                        +{amount}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Amount */}
                        <div>
                            <label className="text-sm font-medium text-foreground">Custom Amount</label>
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                value={awardAmount}
                                onChange={(e) => setAwardAmount(Math.max(1, parseInt(e.target.value) || 0))}
                                className="w-full mt-1 px-3 py-2 border rounded-md text-foreground bg-background"
                            />
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="text-sm font-medium text-foreground">Reason</label>
                            <select
                                value={awardReason}
                                onChange={(e) => setAwardReason(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border rounded-md text-foreground bg-background"
                            >
                                <option value="parent_bonus">Bonus from Parent</option>
                                <option value="good_behavior">Good Behavior</option>
                                <option value="chores_completed">Completed Chores</option>
                                <option value="homework_done">Finished Homework</option>
                                <option value="healthy_gaming">Healthy Gaming Habits</option>
                                <option value="took_break">Took a Break</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Preview */}
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">
                                {childName} will receive
                            </p>
                            <p className="text-2xl font-bold text-yellow-600">
                                +{awardAmount} points
                            </p>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowAwardDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                                onClick={handleAwardPoints}
                                disabled={awardPointsMutation.isPending || awardAmount < 1}
                            >
                                {awardPointsMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Award Points'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Reward Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-purple-600" />
                            Create New Reward
                        </DialogTitle>
                        <DialogDescription>
                            Create a reward that {childName} can earn with their points.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* Icon Picker */}
                        <div>
                            <label className="text-sm font-medium text-foreground">Icon</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {['🎁', '🎮', '🎬', '🍕', '🎯', '⏰', '🌙', '⭐', '🏆', '🎉', '📱', '🛒'].map((emoji) => (
                                    <Button
                                        key={emoji}
                                        variant={newReward.icon === emoji ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setNewReward(prev => ({ ...prev, icon: emoji }))}
                                        className={`text-xl w-10 h-10 p-0 ${newReward.icon === emoji ? 'bg-purple-600' : ''}`}
                                    >
                                        {emoji}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Reward Name */}
                        <div>
                            <label className="text-sm font-medium text-foreground">Reward Name</label>
                            <input
                                type="text"
                                placeholder="e.g., 1 Hour Extra Screen Time"
                                value={newReward.name}
                                onChange={(e) => setNewReward(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full mt-1 px-3 py-2 border rounded-md text-foreground bg-background"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-medium text-foreground">Description</label>
                            <input
                                type="text"
                                placeholder="e.g., Get an extra hour of gaming time"
                                value={newReward.description}
                                onChange={(e) => setNewReward(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full mt-1 px-3 py-2 border rounded-md text-foreground bg-background"
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="text-sm font-medium text-foreground">Type</label>
                            <select
                                value={newReward.type}
                                onChange={(e) => setNewReward(prev => ({ ...prev, type: e.target.value as typeof prev.type }))}
                                className="w-full mt-1 px-3 py-2 border rounded-md text-foreground bg-background"
                            >
                                <option value="extra_time">Extra Screen Time</option>
                                <option value="new_game">New Game</option>
                                <option value="special_privilege">Special Privilege</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        {/* Points Required */}
                        <div>
                            <label className="text-sm font-medium text-foreground">Points Required</label>
                            <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                {[50, 100, 150, 200, 300, 500].map((pts) => (
                                    <Button
                                        key={pts}
                                        variant={newReward.points === pts ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setNewReward(prev => ({ ...prev, points: pts }))}
                                        className={newReward.points === pts ? 'bg-purple-600 hover:bg-purple-700' : ''}
                                    >
                                        {pts}
                                    </Button>
                                ))}
                            </div>
                            <input
                                type="number"
                                min="10"
                                max="10000"
                                value={newReward.points}
                                onChange={(e) => setNewReward(prev => ({ ...prev, points: Math.max(10, parseInt(e.target.value) || 10) }))}
                                className="w-full px-3 py-2 border rounded-md text-foreground bg-background"
                            />
                        </div>

                        {/* Preview */}
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{newReward.icon}</span>
                                <div>
                                    <p className="font-medium text-foreground">{newReward.name || 'Reward Name'}</p>
                                    <p className="text-xs text-muted-foreground">{newReward.description || 'Description'}</p>
                                    <p className="text-sm font-medium text-purple-600 mt-1">{newReward.points} points</p>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowCreateDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                onClick={handleCreateReward}
                                disabled={createRewardMutation.isPending || !newReward.name.trim()}
                            >
                                {createRewardMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Create Reward'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
