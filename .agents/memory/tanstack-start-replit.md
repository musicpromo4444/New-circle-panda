---
name: TanStack Start on Replit
description: Replit startup behavior for imported Lovable TanStack Start projects.
---

Use the native TanStack Start Vite plugin stack when an imported project’s Lovable Vite wrapper resolves as a client-only config in Replit. The symptom is a missing index entry or every route returning 404 even though Vite reports ready.

**Why:** The imported wrapper did not load the SSR route plugin in this environment, while the native plugin stack served the existing routes correctly on port 5000.

**How to apply:** Keep the TanStack Start plugin before React, retain Tailwind and tsconfig path resolution, bind the preview workflow to `0.0.0.0:5000`, and verify both an HTTP route response and a Preview screenshot after restarting.
