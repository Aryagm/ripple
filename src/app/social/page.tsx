'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useGamificationStore } from '@/store/gamification-store';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Flame,
  Lock,
  Share2,
  Users,
  Sparkles,
  Check,
} from 'lucide-react';
import { Achievement, AchievementRarity } from '@/types/gamification';

function SocialSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

// Mock leaderboard data
const MOCK_LEADERBOARD = [
  { id: '1', name: 'Alex Chen', points: 2450, streak: 15, avatar: 'AC' },
  { id: '2', name: 'Jordan Lee', points: 2120, streak: 12, avatar: 'JL' },
  { id: '3', name: 'Sam Wilson', points: 1890, streak: 8, avatar: 'SW' },
  { id: '4', name: 'Casey Kim', points: 1650, streak: 10, avatar: 'CK' },
  { id: '5', name: 'Morgan Davis', points: 1420, streak: 6, avatar: 'MD' },
];

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

const RARITY_ICONS: Record<AchievementRarity, typeof Star> = {
  common: Star,
  rare: Medal,
  epic: Trophy,
  legendary: Crown,
};

export default function SocialPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const user = useUserStore((state) => state.user);
  const { totalPoints, unlockedAchievements, currentOverallStreak, hasAchievement } = useGamificationStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [mounted, user, router]);

  if (!mounted) {
    return (
      <AppShell title="Social">
        <SocialSkeleton />
      </AppShell>
    );
  }

  if (!user?.onboardingCompleted) return null;

  // Insert current user into leaderboard
  const userEntry = {
    id: 'current',
    name: user.name || 'You',
    points: totalPoints,
    streak: currentOverallStreak,
    avatar: user.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'ME',
    isCurrentUser: true,
  };

  const leaderboard = [...MOCK_LEADERBOARD, userEntry]
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  const userRank = leaderboard.findIndex((u) => u.id === 'current') + 1;

  // Group achievements by category
  const achievementsByCategory = ACHIEVEMENTS.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const handleShare = async () => {
    const text = `I've earned ${totalPoints} points on Ripple! 🌊 My streak is ${currentOverallStreak} days. #RippleWellbeing`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <AppShell title="Social">
      <div className="py-6 space-y-6">
        {/* Your Stats Card */}
        <Card className="border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {userEntry.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">Rank #{userRank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Badge variant="secondary" className="gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                {currentOverallStreak} day streak
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3 text-yellow-500" />
                {unlockedAchievements.length} achievements
              </Badge>
            </div>
            <Button className="w-full mt-4" variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Progress
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaderboard">
              <Users className="h-4 w-4 mr-1" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="h-4 w-4 mr-1" />
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Weekly Leaderboard</CardTitle>
                <CardDescription>Compete with other students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => {
                    const isUser = entry.id === 'current';
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          isUser ? 'bg-primary/20 border border-primary/50' : 'bg-secondary/50'
                        }`}
                      >
                        <div className="w-8 text-center">
                          {index === 0 ? (
                            <Crown className="h-5 w-5 text-yellow-500 mx-auto" />
                          ) : index === 1 ? (
                            <Medal className="h-5 w-5 text-gray-400 mx-auto" />
                          ) : index === 2 ? (
                            <Medal className="h-5 w-5 text-amber-600 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground font-medium">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : ''}>
                            {entry.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${isUser ? 'text-primary' : ''}`}>
                            {entry.name} {isUser && '(You)'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.streak} day streak
                          </p>
                        </div>
                        <span className="font-bold">{entry.points}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {/* Achievement Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Collection Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {unlockedAchievements.length} / {ACHIEVEMENTS.length}
                  </span>
                </div>
                <Progress
                  value={(unlockedAchievements.length / ACHIEVEMENTS.length) * 100}
                  className="h-2"
                />
              </CardContent>
            </Card>

            {/* Achievements by Category */}
            {Object.entries(achievementsByCategory).map(([category, achievements]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {achievements.map((achievement) => {
                      const isUnlocked = hasAchievement(achievement.id);
                      const RarityIcon = RARITY_ICONS[achievement.rarity];
                      const rarityColor = RARITY_COLORS[achievement.rarity];

                      return (
                        <div
                          key={achievement.id}
                          className={`p-3 rounded-lg border ${
                            isUnlocked
                              ? 'bg-card border-border'
                              : 'bg-muted/30 border-muted opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isUnlocked ? '' : 'bg-muted'
                              }`}
                              style={{
                                backgroundColor: isUnlocked ? rarityColor + '20' : undefined,
                              }}
                            >
                              {isUnlocked ? (
                                <RarityIcon
                                  className="h-4 w-4"
                                  style={{ color: rarityColor }}
                                />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{achievement.title}</p>
                              <p className="text-[10px] text-muted-foreground line-clamp-2">
                                {achievement.description}
                              </p>
                            </div>
                          </div>
                          {isUnlocked && (
                            <Badge
                              variant="outline"
                              className="mt-2 w-full justify-center text-[10px]"
                              style={{ borderColor: rarityColor, color: rarityColor }}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Unlocked
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
