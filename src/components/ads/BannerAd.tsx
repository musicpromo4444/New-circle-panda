import { ExternalLink } from "lucide-react";
import type { BannerAdData } from "./AdTypes";
import { BANNER_ADS } from "./AdTypes";
import { notifyAdEvent, openAdExternalUrl } from "./platformAdBridge";

export interface BannerAdProps {
  index?: number;
  adData?: BannerAdData;
  className?: string;
}

export function BannerAd({ index = 0, adData, className = "" }: BannerAdProps) {
  const ad = adData ?? BANNER_ADS[Math.abs(index) % BANNER_ADS.length];

  const handleClick = () => {
    notifyAdEvent("click", { adId: ad.id, format: "banner" });
    openAdExternalUrl(ad.ctaUrl, ad.sponsor);
  };

  return (
    <div
      role="complementary"
      aria-label="Sponsored banner advertisement"
      className={`w-full overflow-hidden rounded-2xl border border-primary/20 bg-secondary/80 shadow-md ${className}`}
    >
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <div className={`grid size-12 shrink-0 place-items-center rounded-xl text-xl ${ad.iconBg ?? "bg-muted"}`}>
          {ad.iconEmoji ?? "📣"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold">{ad.sponsor}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">
              {ad.badge ?? "Sponsored"}
            </span>
          </div>
          <p className="truncate text-xs font-semibold">{ad.headline}</p>
          <p className="truncate text-[11px] text-muted-foreground">{ad.description}</p>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="flex min-h-[40px] shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
        >
          {ad.callToAction}
          <ExternalLink className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
