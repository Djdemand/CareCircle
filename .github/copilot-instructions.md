# Copilot instructions for CareCircle

This file helps AI coding agents become productive quickly in this repository. Keep edits concise and only document discoverable, enforced patterns.

1. Big picture
- App: Mobile-first React Native app built with Expo (see [package.json](package.json)).
- Real-time: primary sync uses Supabase Realtime; fallback local mode uses device storage (`src/utils/localStorage.ts`).
- Safety: the DB enforces single-dose-per-window via the `unique_dose_window` constraint in [supabase/setup.sql](supabase/setup.sql).

2. Important files to inspect
- Project entry & scripts: [package.json](package.json)
- High-level README and setup notes: [README.md](README.md)
- Realtime subscription and initial fetch: [src/hooks/useRealtimeMeds.ts](src/hooks/useRealtimeMeds.ts) (uses Supabase channel `schema-db-changes`).
- Local-only persistence: [src/utils/localStorage.ts](src/utils/localStorage.ts) (uses AsyncStorage and dedupes by `med_id` + `window_start`).
- Dose window logic: [src/utils/doseCalc.ts](src/utils/doseCalc.ts) — returns `windowStart`/`windowEnd` and `isDue`.
- UI example: [src/components/MedicationCard.tsx](src/components/MedicationCard.tsx)
- DB schema & constraints: [supabase/setup.sql](supabase/setup.sql)

3. Coding guidance (project-specific)
- Never remove or weaken the `unique_dose_window` constraint in `med_logs`. The app relies on DB-level enforcement to prevent double-dosing across devices.
- When adding or changing realtime listeners, keep the same channel name (`schema-db-changes`) or update all subscribers consistently. Example pattern used in the repo:

```ts
// src/hooks/useRealtimeMeds.ts
const channel = supabase
  .channel('schema-db-changes')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'med_logs' }, handler)
  .subscribe();
```

- Local fallback must maintain the same dedupe keys: `med_id` and `window_start`. `saveLogLocally` implements this — follow its style when adding local writes.
- Dose windows are represented as timestamps (`window_start`, `window_end`) in UTC/Timestamptz. Use `getDoseWindow` in `src/utils/doseCalc.ts` as canonical behavior for UI and server-aligned windows.

4. Dev workflows and commands
- Install: `npm install`
- Run in Expo (local device or simulator): `npx expo start` or use npm scripts in [package.json](package.json) (`npm run ios`, `npm run android`, `npm run web`).
- Supabase setup (one-time): run SQL in [supabase/setup.sql](supabase/setup.sql) inside Supabase SQL editor. Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set in environment or `.env`.

5. Integration notes
- Supabase client is constructed from `process.env.EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (see `src/hooks/useRealtimeMeds.ts`). Agents should avoid hardcoding these values.
- The DB uses RLS policies (demo simplified). If changing policies, ensure client keys maintain intended read/write access for team members.

6. Testing and safety checks
- When adding code that writes `med_logs`, validate uniqueness against the DB constraint and handle the duplicate error gracefully (the app currently logs and returns false in local mode).
- Prefer server/DB-level enforcement for cross-device invariants (e.g., dose uniqueness). Client-side checks are helpful but not sufficient.

7. Style & conventions
- TypeScript with React Native + Expo. Follow existing patterns: small focused utility files in `src/utils`, UI in `src/components`, hooks in `src/hooks`, screens in `src/screens`.
- Keep functions small and export named utilities (see `doseCalc.ts` and `localStorage.ts`).

8. When you need more context
- Inspect [README.md](README.md) for architectural rationale.
- Look at `supabase/setup.sql` for schema guarantees relied upon by code.

If anything here is unclear or you'd like more examples (unit tests, specific interaction flows), tell me which area to expand.
