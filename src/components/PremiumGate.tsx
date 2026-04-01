'use client';

import { useState } from 'react';
import { Crown, Loader2 } from 'lucide-react';
import { redeemPremiumCode, requestPremiumCode } from '@/lib/premium-api';
import { setSubscription } from '@/lib/storage';
import { getPremiumStatus, getRemainingCredits } from '@/lib/premium';
import { toast } from 'sonner';

interface PremiumGateProps {
  tier: 'free' | 'starter5' | 'pro20';
  onUnlock: (newTier: 'free' | 'starter5' | 'pro20', newCredits: number) => void;
  message?: string;
  children: React.ReactNode;
}

export default function PremiumGate({ tier, onUnlock, message, children }: PremiumGateProps) {
  const [premiumCode, setPremiumCode] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [requesting, setRequesting] = useState(false);

  if (tier !== 'free') {
    return <>{children}</>;
  }

  const handleUnlock = async () => {
    if (!premiumCode.trim()) return;
    setUnlocking(true);

    try {
      const subscription = await redeemPremiumCode(premiumCode);
      setSubscription({
        tier: subscription.tier,
        creditsUsed: subscription.creditsUsed,
        unlockedAt: subscription.unlockedAt,
      });

      const status = getPremiumStatus();
      setPremiumCode('');
      toast.success('Plan activated successfully!');
      setTimeout(() => onUnlock(status.tier, getRemainingCredits()), 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to activate premium code.';
      toast.error(msg);
    } finally {
      setUnlocking(false);
    }
  };

  const handleRequestCode = async () => {
    setRequesting(true);

    try {
      const result = await requestPremiumCode('starter5', 'Requested from PremiumGate');
      const adminStatus = result.notifications?.adminEmail;
      const reason = result.notifications?.adminEmailReason;

      if (adminStatus === 'sent') {
        toast.success('Request submitted. Admin has been notified and will send your code after approval.');
      } else if (adminStatus === 'failed') {
        if (reason === 'missing_private_key') {
          toast.error('Request saved, but EmailJS private key is missing. Please contact contactcolsync@gmail.com.');
        } else {
          toast.error('Request saved, but admin email was not confirmed as sent. Please contact contactcolsync@gmail.com.');
        }
      } else {
        toast.success('Request submitted to database. Email notification is not configured yet.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to request premium code.';
      toast.error(msg);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex min-h-[400px] items-center justify-center rounded-2xl">
        <div className="bg-card rounded-2xl shadow-card p-8 text-center max-w-sm w-full mx-4 border border-border">
          <Crown className="w-12 h-12 text-personality-yellow mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Premium Feature Required</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {message || 'This feature requires AI credits. Upgrade your plan to unlock.'}
          </p>
          
          <div className="space-y-3">
            <input
              type="text"
              value={premiumCode}
              onChange={(e) => setPremiumCode(e.target.value)}
              placeholder="Enter unlock code"
              className="w-full h-12 px-4 rounded-xl bg-accent text-foreground placeholder:text-muted-foreground border border-border outline-none text-center tracking-widest font-mono"
              disabled={unlocking || requesting}
            />
            
            <button
              onClick={handleUnlock}
              disabled={unlocking || requesting || !premiumCode.trim()}
              className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all flex items-center justify-center disabled:opacity-50"
            >
              {unlocking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activate Plan'}
            </button>
            
            <button
              onClick={handleRequestCode}
              disabled={unlocking || requesting}
              className="w-full h-10 rounded-xl border border-border hover:bg-accent font-medium text-sm transition-all flex items-center justify-center disabled:opacity-50"
            >
              {requesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {requesting ? 'Requesting...' : 'Request Code'}
            </button>
          </div>
        </div>
      </div>
      <div className="opacity-30 pointer-events-none select-none">{children}</div>
    </div>
  );
}
