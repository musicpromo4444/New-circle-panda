import { Check, ExternalLink, Flame, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActiveAdCreative } from "@/components/ads/adInventoryStorage";
import { openAdExternalUrl } from "@/components/ads/platformAdBridge";
import { WEEKLY_LOGIN_REWARDS } from "./dailyBonusStorage";

export interface DailyBonusModalProps {
  open: boolean;
  streak: number;
  rewardAmount: number;
  isStreakBonus: boolean;
  onClaim: () => void;
  onClose: () => void;
}

/** Fallback sponsor ad if none configured */
const FALLBACK_SPONSOR_AD = {
  sponsor: "MTN Pulse Campus",
  category: "Data & Lifestyle",
  headline: "Get 5GB Night & Weekend Data for ₦500",
  description: "Special student bundles on Circle Panda. Keep chatting uninterrupted.",
  destinationUrl: "https://www.mtn.ng/pulse",
  callToAction: "Get Bundle",
  imageUrl:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
};

/**
 * Modal 1: Daily Login Bonus
 * Displays the Monday-Sunday login cycle (5/10/5/10/50/50/50 BC),
 * sleek static ad banner at top (dynamically synchronized with Admin Ad Inventory Manager),
 * and primary "Claim Reward" button that transitions directly to Modal 2.
 */
export function DailyBonusModal({
  open,
  streak,
  rewardAmount,
  isStreakBonus,
  onClaim,
  onClose,
}: DailyBonusModalProps) {
  const currentStep = ((new Date().getDay() + 6) % 7) + 1;

  // Dynamically subscribe to admin creative inventory for Modal 1
  const activeCreative = useActiveAdCreative("popup_1_daily_login");

  // Fallback ad payload
  const ad = activeCreative || FALLBACK_SPONSOR_AD;

  const handleAdClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openAdExternalUrl(ad.destinationUrl, ad.sponsor);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? onClose() : null)}>
      <DialogContent
        className="max-h-[92vh] w-[92vw] max-w-sm overflow-y-auto rounded-3xl border border-border/80 bg-card p-0 shadow-2xl sm:max-w-md"
        style={{
          width: "clamp(320px, 92vw, 440px)",
        }}
      >
        {/* TOP AD: Sleek Static Banner Ad (Dynamically connected to Admin Inventory) */}
        {ad ? (
          <div className="relative border-b border-border/60 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-3 sm:p-3.5">
            <div className="flex items-center justify-between pb-1 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="rounded bg-muted px-1.5 py-0.5 font-bold uppercase tracking-wider text-[9px] text-foreground">
                  Sponsored
                </span>
                <span className="truncate font-semibold text-foreground">{ad.sponsor}</span>
              </div>
              <span className="text-[10px] opacity-75">{ad.category || "Campus Partner"}</span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex min-w-0 items-center gap-2.5">
                {ad.imageUrl ? (
                  <img
                    src={ad.imageUrl}
                    alt={ad.sponsor}
                    referrerPolicy="no-referrer"
                    className="size-9 shrink-0 rounded-lg border border-border/70 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80";
                    }}
                  />
                ) : (
                  <div
                    className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/20 text-base font-bold text-amber-500"
                    aria-hidden="true"
                  >
                    ⚡
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">{ad.headline}</p>
                  <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
                    {ad.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAdClick}
                className="flex min-h-[32px] shrink-0 items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
              >
                <span>{ad.callToAction || "Explore"}</span>
                <ExternalLink className="size-3" />
              </button>
            </div>
          </div>
        ) : null}

        {/* DIALOG MAIN CONTENT */}
        <div className="px-5 pb-6 pt-4 text-center sm:px-6">
          {/* Panda Avatar with Streak Aura */}
          <div className="relative mx-auto mb-3 flex size-20 items-center justify-center">
            {isStreakBonus ? (
              <div className="absolute inset-0 animate-ping rounded-full bg-orange-500/25 duration-1000" />
            ) : null}
            <div className="relative flex size-20 items-center justify-center rounded-full border-2 border-primary/40 bg-gradient-to-b from-primary/20 to-background text-4xl shadow-inner">
              <span>{isStreakBonus ? "🐼🔥" : "🐼"}</span>
            </div>
            {isStreakBonus ? (
              <div className="absolute -bottom-1 flex items-center gap-0.5 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                <Flame className="size-3 fill-amber-300" /> WEEKEND 50 BC
              </div>
            ) : null}
          </div>

          <DialogHeader className="space-y-1">
            <DialogTitle className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Daily Login Bonus
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Welcome back to Circle Panda! Claim your daily coins below.
            </DialogDescription>
          </DialogHeader>

          {/* 7-DAY LOGIN CYCLE */}
          <div className="my-4 rounded-2xl border border-border/80 bg-secondary/30 p-3.5 sm:p-4">
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">7-Day Login Rewards</span>
              <span className="font-bold text-primary">Day {currentStep} of 7</span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {WEEKLY_LOGIN_REWARDS.map((amount, index) => {
                const active = index + 1 === currentStep;
                const labels = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
                return <div key={labels[index]} className={`rounded-xl border p-2 text-center ${active ? "border-primary bg-primary/15 shadow-sm" : "border-border/60 bg-card/60"}`}>
                  <span className="block text-[9px] font-bold text-muted-foreground">{labels[index]}</span>
                  <span className="my-1 block text-xs font-black">{amount} BC</span>
                  {index + 1 < currentStep ? <Check className="mx-auto size-3 text-primary"/> : active ? <Sparkles className="mx-auto size-3 text-primary"/> : <span className="block h-3"/>}
                </div>;
              })}
            </div>
            <p className="mt-2.5 text-[11px] text-muted-foreground">Monday resets the cycle. Friday-Sunday are 50 BC days.</p>
          </div>

          {/* REWARD SUMMARY BADGE */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2 text-primary">
            <Sparkles className="size-4" />
            <span className="text-xs font-semibold">Today&apos;s Reward:</span>
            <span className="font-display text-lg font-black tracking-tight">
              +{rewardAmount} BC
            </span>
          </div>

          {/* PRIMARY CLAIM ACTION */}
          <Button
            type="button"
            onClick={onClaim}
            className="h-12 w-full rounded-2xl bg-primary font-display text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-98"
          >
            Claim {rewardAmount} BC &amp; Explore
          </Button>

          <p className="mt-2 text-[10px] text-muted-foreground">
            Coins are credited instantly to your Circle Panda wallet. The weekly cycle resets every Monday.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
