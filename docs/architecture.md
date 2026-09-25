# Maduraa System Architecture

## Baseline

```
FIGMA
  ↓
React + TypeScript
  ↓
Tailwind CSS
  ↓
Supabase
 ├─ Authentication
 ├─ PostgreSQL Database
 ├─ Storage
 └─ Row Level Security
  ↓
Vercel
```

## Repository workspaces

- `client/` — frontend workspace
- `server/` — backend/database integration workspace
- `docs/` — architecture, database, API, security, and testing documentation

> The existing Vite application currently uses the root `src/` workspace. Moving it into `client/` is intentionally left as a separate refactor so the baseline scaffold can remain runnable.
