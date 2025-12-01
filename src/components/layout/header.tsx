'use client';

import { useUserStore } from '@/store/user-store';
import { useGamificationStore } from '@/store/gamification-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Flame, Settings, LogOut, Trophy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export function Header({ title }: HeaderProps) {
  const user = useUserStore((state) => state.user);
  const { totalPoints, level, getProgress } = useGamificationStore();

  const progress = getProgress();
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden transition-transform hover:scale-105">
              <Image
                src="/images/ripple_logo.png"
                alt="Ripple"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            {title ? (
              <h1 className="text-lg font-semibold">{title}</h1>
            ) : (
              <span className="text-lg font-semibold">Ripple</span>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Points Badge */}
          <Link href="/social">
            <Badge variant="secondary" className="gap-1 px-2 py-1 cursor-pointer transition-colors hover:bg-secondary/80">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-medium">{totalPoints}</span>
            </Badge>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{user?.name || 'User'}</span>
                    <Badge variant="outline" className="text-xs">
                      Level {level}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress.currentXP} XP</span>
                      <span>{progress.xpToNext} XP to next</span>
                    </div>
                    <Progress value={progress.percentComplete} className="h-1.5" />
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/social" className="cursor-pointer transition-opacity hover:opacity-80">
                  <Trophy className="mr-2 h-4 w-4" />
                  Achievements
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer transition-opacity hover:opacity-80">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
