# Supabase setup checklist

Project: `https://xgxvnttollcioigbdjba.supabase.co`

## 1. Database (once, then per new migration)

In **SQL Editor → New query**, run each file in order and check for errors:

1. `supabase/migrations/20261105000000_init.sql`
2. `supabase/migrations/20261105010000_onboarding.sql`
3. `supabase/seed.sql` (categories; run once)

Later, with the Supabase CLI: `supabase link --project-ref xgxvnttollcioigbdjba` then `supabase db push`.

## 2. Auth → URL Configuration

- **Site URL**: your web URL (for now `http://localhost:8081`)
- **Redirect URLs**: add
  - `t2toys://auth/callback` (native app builds)
  - `exp://**` (Expo Go during development)
  - `http://localhost:8081` (web dev)

## 3. Auth → Providers

| Provider | What you need | Where |
| --- | --- | --- |
| Phone | An SMS provider account (Twilio, MessageBird or Vonage). Enable **Phone**, paste credentials. Costs per SMS; HK numbers supported. | Supabase → Auth → Providers → Phone |
| Google | OAuth client ID + secret from Google Cloud Console (type: Web application). Authorised redirect URI = the callback URL Supabase shows on the Google provider page. | Google Cloud Console → APIs & Services → Credentials |
| Apple | Apple Developer account. Services ID + key for web/Android; on iOS the app uses native Sign in with Apple, so add the app's bundle ID to **Client IDs** in the Apple provider. | developer.apple.com → Certificates, IDs & Profiles |

Until a provider is configured, its button returns an error message in the app; nothing crashes.

## 4. Keys

- The app uses only the **publishable** key (`EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`).
- Never put the **secret / service_role** key in the app or in git.

## Testing without SMS costs

Supabase → Auth → Providers → Phone → **Test phone numbers**: add e.g. `85291234567` with code `123456`.
