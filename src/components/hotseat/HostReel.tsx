import { useEffect, useRef, useState } from "react";
import { Timer, Volume2, VolumeX } from "lucide-react";
import { formatCountdown, type HostRow } from "@/lib/hotseat";

/** Hot Seat live-cycle reel with mute toggle and the live-cycle timer. */
export function HostReel({ host }: { host: HostRow }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [left, setLeft] = useState(() => { const elapsed = Math.max(0, Date.now() - new Date(host.started_at).getTime()); const pos = Math.floor(elapsed / 1000) % 14400; return Math.max(0, (pos < 10800 ? 10800 - pos : 14400 - pos) * 1000); });

  useEffect(() => {
    const i = setInterval(() => setLeft(() => { const elapsed = Math.max(0, Date.now() - new Date(host.started_at).getTime()); const pos = Math.floor(elapsed / 1000) % 14400; return Math.max(0, (pos < 10800 ? 10800 - pos : 14400 - pos) * 1000); }), 1000);
    return () => clearInterval(i);
  }, [host.ends_at]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  return (
    <div className="relative h-[40vh] min-h-56 w-full overflow-hidden bg-black">
      {host.media_url && host.media_kind === "video" ? (
        <video
          ref={videoRef}
          src={host.media_url}
          className="size-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <div className="grid size-full place-items-center bg-gradient-to-br from-primary/30 to-[var(--dating)]/25 text-6xl">
          {host.avatar}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/40" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <span className="flex items-center gap-1.5 rounded-full border border-destructive/60 bg-background/70 px-2.5 py-1 font-display text-xs font-semibold tabular-nums text-destructive backdrop-blur">
          <Timer className="size-3.5" /> {formatCountdown(left)} left
        </span>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute host reel" : "Mute host reel"}
          className="grid size-9 place-items-center rounded-full border border-border/60 bg-background/70 text-foreground backdrop-blur transition-colors hover:border-primary/60"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
        <span className="flex size-12 items-center justify-center rounded-full border-2 border-primary bg-background text-2xl leading-none shadow-[0_0_25px_hsl(var(--primary)/0.4)]">
          {host.avatar}
        </span>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            Host · 3-Hour Live Cycle
          </span>
          <p className="truncate font-display text-lg font-semibold">{host.alias}</p>
        </div>
      </div>
    </div>
  );
}
