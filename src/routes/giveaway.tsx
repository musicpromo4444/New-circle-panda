import { createFileRoute } from "@tanstack/react-router";
import { Giveaway } from "@/components/break-lounge/Giveaway";

export const Route = createFileRoute("/giveaway")({ component: Giveaway });
