# Replit setup

## Run the app

The project uses Bun with the existing TanStack Start/Vite stack.

```sh
bun install
bun run dev -- --host 0.0.0.0 --port 5000
```

The Replit workflow is configured as `Start application` and serves the preview on port 5000.

## Environment

The Supabase client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or the configured anonymous key) for browser access. Keep service-role credentials server-only.

## Hot Seat

The interactive page is available at `/hot-seat`. It uses the existing Panda Coin store for queue entry and priority boosts, and its admin panel is available to the app's current admin user.
