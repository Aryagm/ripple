'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (user?.onboardingCompleted) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [mounted, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden animate-pulse">
          <Image
            src="/images/ripple_logo.png"
            alt="Ripple"
            width={64}
            height={64}
            className="w-full h-full object-contain"
          />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading Ripple...</p>
      </div>
    </div>
  );
}
