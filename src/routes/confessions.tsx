import { createFileRoute } from "@tanstack/react-router";
import { MessageCircleHeart, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StandardBannerAd } from "@/components/ads/StandardBannerAd";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/confessions")({
  head: () => ({ meta: [{ title: "Confessions — Circle Panda" }] }),
  component: ConfessionsPage,
});

export function ConfessionsPage() {
  const { posts } = useStore();
  const confessions = posts.length ? posts : [
    { id: "demo-1", author: "Anonymous Panda", body: "I smile like I have everything figured out. I really don't. 🐼", at: Date.now(), replies: [], likes: 12 },
    { id: "demo-2", author: "Anonymous Panda", body: "Sometimes you just need one person to say: I understand.", at: Date.now() - 60000, replies: [], likes: 8 },
  ];

  return (
    <AppShell title="Confessions" subtitle="One confession after another. Anonymous and easy to scroll.">
      <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 font-display font-bold"><MessageCircleHeart className="size-5 text-primary" /> Confession activity</div>
        <p className="mt-1 text-xs text-muted-foreground">Read the next card, react, then keep scrolling. Sponsored placements appear after every 5 cards.</p>
      </div>
      <div className="space-y-4">
        {confessions.map((post, index) => (
          <div key={post.id} className="space-y-4">
            <article className="panda-panel rounded-3xl p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="grid size-9 place-items-center rounded-full bg-primary/10 text-lg">🐼</span><span>Anonymous Panda</span><Sparkles className="ml-auto size-4 text-primary" /></div>
              <p className="mt-5 text-lg leading-relaxed">{post.body}</p>
              <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground"><span>💚 {post.likes ?? 0}</span><span>💬 {post.replies.length}</span></div>
            </article>
            {(index + 1) % 5 === 0 ? <StandardBannerAd index={Math.floor(index / 5)} /> : null}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
