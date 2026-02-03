// src/components/dashboard/RewardsSection.tsx
import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Reward {
    id: string;
    reward_name: string;
    reward_type: string;
    description: string;
    points_required: number;
    icon: string;
}

interface RedemptionHistory {
    id: string;
    reward_name: string;
    icon: string;
    points_spent: number;
    status: 'pending' | 'approved' | 'denied' | 'completed';
    requested_at: string;
}

export function RewardsSection() {
    const [pointsBalance, setPointsBalance] = useState<number | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redemptionHistory, setRedemptionHistory] = useState<RedemptionHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCatalog, setShowCatalog] = useState(false);
    const [requesting, setRequesting] = useState<string | null>(null);

    useEffect(() => {
        loadRewardsData();
        // Refetch when parent awards points from web (poll every 60s and when window becomes visible)
        const interval = setInterval(loadRewardsData, 60 * 1000);
        const onVisible = () => { if (document.visibilityState === 'visible') loadRewardsData(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    const loadRewardsData = async () => {
        setLoading(true);
        try {
            // Get points balance from IPC (null on error - don't overwrite with 0)
            const balance = await (window as any).electronAPI?.getPointsBalance?.();
            setPointsBalance((prev) => (balance !== null && balance !== undefined ? balance : (prev ?? 0)));

            // Get available rewards
            const rewardsData = await (window as any).electronAPI?.getAvailableRewards?.();
            setRewards(rewardsData ?? []);

            // Get redemption history
            const history = await (window as any).electronAPI?.getRedemptionHistory?.();
            setRedemptionHistory(history ?? []);
        } catch (error) {
            console.error('Failed to load rewards data:', error);
            // Keep previous points on error so modal doesn't show 0 on re-open
            setPointsBalance((prev) => prev ?? 0);
        }
        setLoading(false);
    };

    const handleRequestReward = async (rewardId: string) => {
        setRequesting(rewardId);
        try {
            const result = await (window as any).electronAPI?.requestReward?.(rewardId);
            if (result?.success) {
                // Refresh data
                await loadRewardsData();
                setShowCatalog(false);
            } else {
                alert(result?.error || 'Failed to request reward');
            }
        } catch (error) {
            console.error('Failed to request reward:', error);
            alert('Failed to request reward');
        }
        setRequesting(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">⏳ Pending</span>;
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">✅ Approved</span>;
            case 'denied':
                return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">❌ Denied</span>;
            case 'completed':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">🎉 Completed</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="h-20 bg-muted rounded"></div>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        <h3 className="text-lg font-semibold">My Reward Points</h3>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowCatalog(true)}
                        className="gap-2"
                    >
                        🎁 Request Reward
                    </Button>
                </div>

                {/* Points Balance */}
                <div className="mb-6 p-4 bg-white/50 dark:bg-black/20 rounded-lg text-center">
                    <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                        {pointsBalance ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Points Available
                    </p>
                </div>

                {/* Quick Info */}
                <div className="text-sm text-muted-foreground mb-4 space-y-1">
                    <p>🎮 Play healthy to earn more points!</p>
                    <p>⏰ Take breaks and follow limits to earn bonus points</p>
                    {(pointsBalance ?? 0) === 0 && (
                        <p className="text-xs mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                            💡 <strong>Points still 0?</strong> Make sure the Child ID in this app&apos;s Settings matches the child on your parent&apos;s dashboard (parent copies Child ID from web Settings → paste here).
                        </p>
                    )}
                    <p className="text-xs mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                        💡 <strong>Tip:</strong> You can request rewards even with 0 points! 
                        Your parent can approve or deny any request.
                    </p>
                </div>

                {/* Pending Requests */}
                {redemptionHistory.filter(r => r.status === 'pending').length > 0 && (
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Pending Requests</h4>
                        <div className="space-y-2">
                            {redemptionHistory
                                .filter(r => r.status === 'pending')
                                .map(redemption => (
                                    <div key={redemption.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded">
                                        <div className="flex items-center gap-2">
                                            <span>{redemption.icon}</span>
                                            <span className="font-medium">{redemption.reward_name}</span>
                                        </div>
                                        {getStatusBadge(redemption.status)}
                                    </div>
                                ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            ⏳ Waiting for parent approval...
                        </p>
                    </div>
                )}
            </Card>

            {/* Rewards Catalog Modal */}
            {showCatalog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">🎁 Request a Reward</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowCatalog(false)}>
                                ✕
                            </Button>
                        </div>

                        <p className="text-muted-foreground mb-4">
                            You have <strong className="text-yellow-600">{pointsBalance}</strong> points.
                            Choose a reward to request!
                        </p>

                        {rewards.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No rewards available yet. Ask your parent to set up rewards!
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {rewards.map(reward => {
                                    const canAfford = reward.points_required <= (pointsBalance || 0);
                                    const isRequesting = requesting === reward.id;

                                    return (
                                        <div
                                            key={reward.id}
                                            className={`p-4 border rounded-lg ${canAfford ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : 'border-gray-200 opacity-60'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{reward.icon}</span>
                                                    <div>
                                                        <h4 className="font-medium">{reward.reward_name}</h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            {reward.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${canAfford ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {reward.points_required} pts
                                                    </p>
                                                </div>
                                            </div>
                                            {canAfford ? (
                                                <Button
                                                    size="sm"
                                                    className="w-full mt-3"
                                                    onClick={() => handleRequestReward(reward.id)}
                                                    disabled={isRequesting}
                                                >
                                                    {isRequesting ? 'Requesting...' : '🎯 Request This!'}
                                                </Button>
                                            ) : (
                                                <p className="text-xs text-center text-muted-foreground mt-3">
                                                    Need {reward.points_required - (pointsBalance || 0)} more points
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Recent History */}
                        {redemptionHistory.length > 0 && (
                            <div className="border-t mt-6 pt-4">
                                <h4 className="font-medium mb-2">Recent Requests</h4>
                                <div className="space-y-2">
                                    {redemptionHistory.slice(0, 5).map(redemption => (
                                        <div key={redemption.id} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span>{redemption.icon}</span>
                                                <span>{redemption.reward_name}</span>
                                            </div>
                                            {getStatusBadge(redemption.status)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
