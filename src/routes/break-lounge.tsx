import { createFileRoute } from "@tanstack/react-router";
import { BreakLounge } from "@/components/break-lounge/BreakLounge";

export const Route = createFileRoute("/break-lounge")({
  component: BreakLounge,
});
