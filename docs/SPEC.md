# t2 Toys v2 — Product Spec (v1 release)

Status: draft · Owner: Ian · Last updated: 2026-11-05

## 1. Why we are rebuilding

The current t2 Toys app sits at 1.7★ (120 ratings, HK App Store). The causes, in order of damage:

1. **Broken core flows** — private messages (PM) broke repeatedly (2022, 2025); the app hung on the loading screen in Aug 2026.
2. **Money handling** — paid credits failed to appear after top-up (fixed only in 4.2.11, Oct 2026). Users call it a scam.
3. **Pay-to-post** — since 3.0.0 (Aug 2022) sellers must spend credits to list.
4. **No trust layer** — no ratings, no reporting, moderation by threat banner.
5. **Weak discovery** — no filters, no category feeds, no saved searches.

v1 fixes these before adding anything new.

## 2. Product principles

- **Listing is free.** We earn from optional extras, never from the right to sell.
- **Chat must never break.** It is the product. It gets the most tests.
- **Every paid item is server-verified** and visible in a purchase history. No silent failures.
- **Browse without an account.** Ask to sign in only when posting, chatting, saving or rating.
- **Category-first.** Users see what they care about. Airsoft is the largest category and gets first-class support, but never floods other users' feeds.
- **zh-HK first**, English second. All UI copy goes through i18n.

## 3. Users

| Persona | Need |
| --- | --- |
| Airsoft player (majority of supply) | Sell/buy GBB, AEG, gear, parts quickly; check compliance; meet up at an MTR station |
| Collector (Gunpla, figures, LEGO, TCG) | Find specific items; get alerted when they appear; avoid weapon content |
| Casual seller | Declutter in under 2 minutes |
| Moderator (t2 staff) | Review flagged listings and reports; suspend users |

## 4. Categories

Seeded from the current app, in display order. `airsoft` is flagged `requires_compliance = true` and `sensitive = true` (hidden from home feed until the user opts in at onboarding or by following it).

1. 野戰生存遊戲 Airsoft & wargame — subcategories: GBB pistols, GBB rifles, AEG, gas/CO2 revolvers, sniper rifles, optics, gear & vests, parts & upgrades, magazines
2. 模型擺設 Figures & collectibles (超合金, Figure)
3. 高達模型 Gunpla
4. LEGO 樂高
5. 桌遊 / 遊戲卡 Board games & TCG
6. 車仔模型 Diecast cars
7. 遙控無人機 Drones & aerial
8. 遙控車 / 載具 RC cars & vehicles
9. 遙控船 RC boats
10. 遙控飛機 RC planes
11. 遙控直昇機 RC helicopters
12. 迷你四驅車 Mini 4WD
13. NERF
14. 飛鏢 Darts
15. 珍藏球衣 Collectible jerseys
16. 珍藏鞋類 Collectible sneakers
17. 電玩遊戲 Video games
18. 其他 Other

## 5. v1 scope

### 5.1 Must have

| Area | Requirement |
| --- | --- |
| Auth | Sign in with Apple, Google, SMS OTP (+852 default; +886, +1, other). Guest browsing. Username set at first sign-in. |
| Onboarding | Pick interests (multi-select categories). Airsoft shows an 18+ confirmation and HK law notice before it can be followed. |
| Home | Feed of listings from followed categories, newest first; category chips row; "Wanted" tab. |
| Listing card | Photo, title (max 2 lines), price formatted `HK$1,500` or `議價`, condition, district, relative time, Reserved/Sold badge. |
| Listing detail | Up to 10 photos, description (2,000 chars), condition, meet-up areas, seller card (rating, join date, response rate), Chat / Make offer, Save, Share, Report. |
| Create listing | Type (Sell / Wanted), category + subcategory, photos (1–10), title (80), price or negotiable, condition, description, meet-up districts/MTR stations, delivery options. Airsoft adds compliance attestation (§6). Drafts autosave. |
| Search | Full-text (Chinese + English), filters: category, price range, condition, district, type; sort: newest, price ↑/↓. Saved searches with push alerts. |
| Chat | 1:1 per listing. Text, photos, offers (amount + accept/decline). Push notifications. Unread counts. Block user. |
| Deal completion | Seller marks Sold to a chat partner → both can rate (1–5 + tag + optional comment) within 14 days. |
| Profile | Avatar, username, bio, rating average + count, listings, reviews, joined date, verified phone badge. |
| My listings | Edit, Reserve, Mark sold, Bump (free once / 7 days), Delete. |
| Trust & safety | Report listing/user/message with reason; block; automated pre-screen (§6); moderator queue (web admin). |
| Settings | Language (繁中/English), notifications per type, blocked users, purchase history, delete account (App Store requirement). |

### 5.2 Paid extras (milestone M7, after core is stable)

All via Apple/Google IAP through RevenueCat; entitlements are verified by webhook into `purchases`.

| Product | Effect |
| --- | --- |
| Boost (consumable) | Bump to top of category feed + "Featured" label for 24h |
| Featured slot (consumable) | Pinned in category header carousel for 3 days |
| Pro Seller (subscription) | Shop page, 20 photos, listing analytics, 3 free boosts/month |

Legacy t2 credits and VIP terms are migrated and honoured (§9).

### 5.3 Out of scope for v1

In-app payment for goods / escrow (SVF licensing risk), shipping integrations, auctions, news section, desktop admin beyond the moderation queue.

## 6. Airsoft compliance

Hong Kong's Firearms and Ammunition Ordinance (Cap. 238) treats airsoft guns above about 2 joules muzzle energy as "arms". **Get this confirmed by a HK lawyer before launch.** The app must:

1. Require, on every listing in an airsoft subcategory that is a gun, a checkbox attestation: "This item does not exceed 2 joules muzzle energy and is legal to possess in Hong Kong."
2. Block listings of real firearms, live ammunition, firearm parts for real weapons, and pellets/BBs with metal cores (keyword + AI screen).
3. Run every new listing (photos + text) through an AI pre-screen (Claude API, Supabase Edge Function). Outcome: `approved`, `needs_review` (hidden until a moderator acts), or `rejected` with reason shown to the seller.
4. Gate the airsoft category behind an 18+ confirmation.
5. Show category rules on the create-listing screen.

## 7. Data model (summary)

See `supabase/migrations/` for the source of truth.

- `profiles` — user profile, locale, phone_verified, rating_avg/count
- `categories` — tree (parent_id), slug, names zh/en, sensitive, requires_compliance, sort
- `user_interests` — user ↔ category follows
- `listings` — seller, type (sell/wanted), category, title, description, price_hkd (nullable = negotiable), condition, status (draft/active/reserved/sold/removed), moderation_status, districts[], delivery, compliance_attested_at, bumped_at
- `listing_photos` — storage path, position
- `saved_listings`, `saved_searches`
- `conversations` (listing, buyer, seller) + `messages` (text/photo/offer/system)
- `reviews` — one per side per completed deal
- `reports`, `blocks`
- `moderation_events` — AI and human decisions with reasons
- `purchases` — IAP records from RevenueCat webhooks; `credit_ledger` for migrated legacy credits

All tables use Row Level Security. Users can only write their own rows; moderators use a `role` claim.

## 8. Milestones

Each milestone ends with typecheck, lint, tests passing, and a TestFlight/internal build.

| # | Milestone | Done when |
| --- | --- | --- |
| M0 | Foundations | Repo, CLAUDE.md, schema, Expo scaffold, theme, i18n, Supabase client, tab shell |
| M1 | Auth & profiles | Apple/Google/OTP sign-in, onboarding interests, profile screen |
| M2 | Listings | Create/edit/detail, photo upload, my listings, statuses |
| M3 | Browse & search | Home feed, category feeds, Typesense search + filters, saved searches |
| M4 | Chat | Realtime chat, offers, push notifications, unread counts, block |
| M5 | Trust | Mark sold, reviews, reports, AI pre-screen, moderation queue |
| M6 | Migration | Import legacy users/listings/credits from t2 export; dry-run report |
| M7 | Paid extras | RevenueCat, boosts, featured, Pro; purchase history |
| M8 | Launch | Store listings (zh-HK + en), screenshots, analytics, crash reporting, release as update to existing app IDs; switch web `output` from `single` to `static` with public listing pages for SEO |

## 9. Migration from the current app

Needs from the client: database export (users, phone numbers, listings, photos, credit and VIP balances), App Store Connect and Play Console access, Apple Team ID and existing bundle IDs.

- Users are matched by phone number on first OTP sign-in and their history is attached.
- Credit balances become `credit_ledger` entries spendable on boosts at a published rate.
- Active VIP memberships convert to Pro Seller until their original expiry.
- Ship under the existing bundle ID `com.inlooptech.t2toys` (Android) and the existing iOS app ID so users receive it as an update.

## 10. Open questions

- [ ] Legal confirmation of airsoft rules and attestation wording
- [ ] Exact legacy credit → boost conversion rate
- [ ] Does the client want to keep the "t2 Toys" brand and logo as-is?
- [ ] Who staffs moderation, and with what response-time target?
- [ ] Typesense Cloud vs self-hosted
