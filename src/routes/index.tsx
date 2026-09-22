import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { CrushTray } from "@/components/CrushTray";
import { StandardBannerAd } from "@/components/ads/StandardBannerAd";
import { PostCard } from "@/components/feed/PostCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Circle Panda — Anonymous Feed & Panda Coins" },
      {
        name: "description",
        content:
          "Post anonymously, reply in public threads, join 24-hour group chats, and spend Panda Coins on Circle Panda.",
      },
      { property: "og:title", content: "Circle Panda — Anonymous Feed" },
      {
        property: "og:description",
        content:
          "Anonymous posts, ephemeral group chats, dating, and events — powered by Panda Coins.",
      },
    ],
  }),
  component: FeedPage,
});

export function FeedPage() {
  const { posts, addPost } = useStore();
  const [draft, setDraft] = useState("");

  return (
    <AppShell title="Anonymous Feed" subtitle="Nobody knows it's you. Replies are public.">
      <div className="mb-4"><StandardBannerAd variant="compact" index={0} /></div>
      <CrushTray />
      <form
        className="panda-panel mb-5 rounded-2xl p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          addPost(draft.trim());
          setDraft("");
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say the thing you'd never sign your name to…"
          className="min-h-24 resize-none border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between border-t border-border/70 pt-3">
          <span className="text-xs text-muted-foreground">
            Posting is free · messages cost 1 BC
          </span>
          <Button type="submit" disabled={!draft.trim()}>
            Post anonymously
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        {posts.map((p, idx) => (
          <div key={p.id} className="space-y-4">
            <PostCard post={p} />
            {/* Standard banner advertisement after every sequence of 4 posts */}
            {(idx + 1) % 4 === 0 ? <StandardBannerAd index={Math.floor(idx / 4)} /> : null}
          </div>
        ))}
      </div>
      <div className="mt-5"><StandardBannerAd variant="compact" index={1} /></div>
    </AppShell>
  );
}
