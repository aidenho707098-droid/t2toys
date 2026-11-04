# CLAUDE.md — t2 Toys v2

Second-hand toy marketplace for Hong Kong (airsoft is the largest category). Product spec: `docs/SPEC.md`. Read it before starting a milestone. Expo-specific rules: `AGENTS.md` (read it too — Expo APIs change every SDK).

## Stack

- **App**: Expo SDK 58, Expo Router (routes in `src/app/`), TypeScript strict, React Compiler on.
- **Backend**: Supabase — Postgres, Auth, Realtime, Storage, Edge Functions (Deno). Schema lives only in `supabase/migrations/*.sql`.
- **Search**: Typesense (CJK). Synced from Postgres by an Edge Function.
- **IAP**: RevenueCat (milestone M7). Never grant entitlements client-side.
- **i18n**: i18next + expo-localization. Locales `zh-HK` (default) and `en`.

## Layout

```
src/app/            routes only (screens + _layout.tsx)
src/components/     shared UI; ui/ = primitives (Button, Text, Card, Chip…)
src/features/<x>/   feature code: hooks, api calls, components used by one feature
src/lib/            supabase client, i18n setup, formatting, env
src/theme/          tokens.ts (colours, spacing, radii, type) — the ONLY place colours are defined
src/i18n/           zh-HK.json, en.json
supabase/           migrations/, functions/, seed.sql
docs/               SPEC.md, decisions/ (ADR per significant decision)
```

## Rules

### Must
- Every user-facing string goes through `t('…')`. Add keys to both `zh-HK.json` and `en.json` in the same change.
- Colours, spacing, radii, font sizes come from `src/theme/tokens.ts`. No hex codes or magic numbers in components. No default Material/platform accent colours.
- Prices: store integer `price_hkd`; display with `formatPrice()` → `HK$1,500` or `議價` / `Negotiable`. Never show decimals.
- Usernames shown as `@username`, never internal ids.
- Every table has RLS enabled with explicit policies. New table → policy in the same migration.
- Anything involving money, credits, entitlements or moderation decisions runs server-side (Edge Function or SQL function with `security definer`), never trusted from the client.
- Titles truncate with `numberOfLines`, never by clipping a fixed-height container.
- Support Dynamic Type and dark mode; give every Pressable an `accessibilityLabel`.
- Bottom tabs always show text labels.

### Must not
- Don't edit `ios/` or `android/` (Continuous Native Generation).
- Don't add a dependency without `npx expo install` and a one-line reason in the PR/commit message.
- Don't charge to create a listing. Ever. (See SPEC §2.)
- Don't commit secrets. Client env vars use `EXPO_PUBLIC_` and contain only the Supabase URL and anon key.

## Testing

- Unit tests (Jest + @testing-library/react-native) for utils, hooks and feature logic.
- SQL tests (pgTAP) for RLS policies and functions in `supabase/tests/`.
- Highest priority to test: chat delivery and ordering, offer accept/decline, credit ledger, purchase verification, review eligibility, moderation outcomes. These are what broke in the old app.

## Before saying a task is done

```bash
npx tsc --noEmit
npx expo lint
npm test
```

All three must pass. For schema changes also run `supabase db reset` locally and the pgTAP tests.

## Working style

- Work milestone by milestone (SPEC §8). Use plan mode for each milestone; write the plan into `docs/decisions/` if it changes the architecture.
- Small commits with conventional messages (`feat(chat): …`, `fix(listings): …`).
- When unsure about an Expo/Supabase API, fetch current docs rather than guessing.
- Copy tone: friendly Cantonese-flavoured Traditional Chinese (e.g. 「即刻傾」「放售」), concise English.
