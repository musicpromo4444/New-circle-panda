import { createFileRoute } from "@tanstack/react-router";
import { BreakLoungeAdmin } from "@/components/break-lounge/Giveaway";

export const Route = createFileRoute("/admin-water-break")({ component: BreakLoungeAdmin });
