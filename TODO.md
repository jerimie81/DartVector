# DartVector — TODO

Prioritized by severity. "Fix" items reference function/component names, not line numbers.

---

## P0 — Broken/Misleading Functionality

- [ ] **Implement Killer game logic in `applyDartToState` (`lib/game-engine.ts`)**
  - Add `rules.type === 'killer'` branch alongside the existing `x01`/`cricket`/`around_the_clock`/`shanghai`/`bobs_27` branches.
  - Phase 1 (assignment): first dart(s) at own double assign `killerState[playerId].assignedDouble`; until every player has an assigned double, hits elsewhere are no-ops.
  - Phase 2 (killer status): hitting your own assigned double after assignment sets `isKiller: true`.
  - Phase 3 (combat): once `isKiller`, hitting *another player's* assigned double decrements that player's `lives`; hitting your own assigned double while already a killer is a self-hit and should decrement your own lives (standard house rule — make configurable).
  - Elimination: `lives <= 0` → `eliminated: true`, remove from turn rotation.
  - Win condition: last non-eliminated player standing → `isWinDart`/match completion, matching the pattern used for `shanghai`/`bobs_27`.
  - Update `KillerRules`/`KillerPlayerState` in `lib/types.ts` if fields are missing (e.g. self-hit toggle).
  - Add unit tests (see P0 testing item) that exercise all four phases before merging.

- [ ] **Fix or relabel "Online Multiplayer" (`components/multiplayer/MultiplayerLobby.tsx`)**
  - Immediate: correct the UI copy — "Real-time WebSocket & Peer sync match coordination" is false; either implement it or change the string to something accurate ("Same-device tab sync").
  - Real fix — pick one transport and implement:
    - **Firestore-backed rooms** (simplest given the app already depends on Firebase): a `rooms/{roomCode}` doc with a `players` array and a `currentTurn`/`lastDart` field, written via `setDoc`/`updateDoc` and subscribed to via `onSnapshot` for near-real-time sync across devices. Reuses the existing Firebase dependency — no new infra.
    - **WebRTC data channels** if you want to avoid Firestore write costs during a live match (higher effort — needs a signaling step, which can itself go through Firestore).
  - Replace the `BroadcastChannel` listener with the chosen transport; keep `BroadcastChannel` only as a same-device fallback layer if you want, but never as the sole mechanism behind an "Online"-branded feature.
  - Add Firestore rules for the new `rooms` collection (open write for room members only, TTL/cleanup for abandoned rooms).

- [ ] **Lock down `firestore.rules` user-profile read access**
  - Change `match /users/{userId} { allow read: if isAuthenticated(); }` to `allow read: if isOwner(userId);`.
  - If any feature actually needs public-readable profile fields (e.g. a future leaderboard), split those fields into a separate `public_profiles/{userId}` doc with only non-sensitive fields (displayName, avatar, headline stats) rather than exposing the full profile doc.

- [ ] **Add a Google `signInWithRedirect` fallback (`lib/auth-context.tsx`)**
  - Detect standalone/PWA display mode (`window.matchMedia('(display-mode: standalone)')`) or in-app WebView, and use `signInWithRedirect` + `getRedirectResult` instead of `signInWithPopup` in those contexts, since popups are frequently blocked there.

- [ ] **Fix or remove the dead Firestore user-aggregate fields**
  - Either: update `matchesPlayed`, `career3DAvg`, `highestTurn`, `highestCheckout`, `count180s` on the `users/{uid}` doc inside `syncMatchToCloud` (or a Cloud Function trigger on match write) so they're actually meaningful for future server-side leaderboard queries, or
  - Remove them from `UserStats`/`handleUserLogin` entirely and rely solely on the existing client-side `career-stats.ts` computation, to avoid the illusion of a stat that never updates.

---

## P1 — Real Gaps vs. Category

- [ ] **Add a persistent voice-parser mode for dart-by-dart entry**
  - Extend `parseVoiceDartsCommand` (`lib/voice-parser.ts`) to accept a sequence utterance ("twenty, twenty, five") and split it into three individual `DartThrow`s via the existing segment/multiplier vocabulary, instead of only ever producing one aggregate turn score.
  - Route recognized individual darts through `applyDartToState` (one dart at a time) rather than `applyTotalScoreToState`, so bust/checkout detection stays dart-accurate instead of turn-total-accurate.

- [ ] **Add a bundled/offline TTS or recorded-audio fallback (`lib/sound-system.ts`)**
  - Detect `window.speechSynthesis.getVoices().length === 0` (common on stripped-down Android WebViews) and fall back to a small set of pre-recorded announcer audio clips (numbers 1–180 common totals, "GAME SHOT", "BUST") bundled as static assets, so the referee caller isn't silently mute on unsupported devices.

- [ ] **Persist league/tournament state across sessions**
  - `HouseLeagueNightModal.tsx` currently holds league standings only in component state for the session. Move league state into `storageEngine` (IndexedDB) with its own object store (`STORE_LEAGUES`), keyed by league ID, and sync to Firestore under `users/{uid}/leagues/{leagueId}` the same way matches are synced.
  - Add a "resume league night" entry point from the home screen when an in-progress league exists locally.

- [ ] **Scope out camera/sensor auto-scoring (even as a stretch goal)**
  - Not a small lift, but worth an explicit decision: either scope a WebRTC camera + on-device model (e.g. TensorFlow.js) proof-of-concept for dart-tip detection, or explicitly document that DartVector is manual/voice-entry only so it's a stated design choice rather than an apparent omission.

- [ ] **Add automated tests and CI**
  - Add Vitest (fastest fit for the existing Next.js/TS setup) covering: `game-engine.ts` (all six game types, bust/win/leg/set transitions, team-sync logic), `checkout-engine.ts` (table + algorithmic paths), `dartboard-geometry.ts` (coordinate↔segment round-trips), `voice-parser.ts` (slang table + digit/word extraction).
  - Add `.github/workflows/ci.yml`: install → lint → typecheck (`tsc --noEmit`) → test → build, on push/PR to main.
  - Add a `.github/workflows/deploy.yml` (or extend CI) for Vercel/Cloud Run deploy-on-merge, matching the manual deployment options already documented in `README.md`.

---

## P2 — Top 50 Ease-of-Use Improvements

### Score entry & in-match flow
1. Add an "undo last dart" button always visible during scoring, not just via voice command.
2. Add haptic feedback (`navigator.vibrate`) on tap-scoring for mobile, distinct pulses for single/double/treble/bull/miss.
3. Show a live running checkout suggestion overlay on the dartboard itself (highlight the suggested segment) instead of only text, using `getCheckoutSuggestion`.
4. Add a "quick-score" numeric keypad as an always-available alternative next to the SVG board, not buried in a mode switch.
5. Confirm-before-bust: when a dart would bust, show a 1–2 second inline warning before committing, in case of mis-tap.
6. Add a visible dart-by-dart mini history for the current turn (three dart icons that fill in as thrown) so players can see what's been thrown without checking a log.
7. Auto-advance focus/highlight to the next player after each turn with a brief animated transition so the active player is never ambiguous on a shared tablet.
8. Add a "confirm scorer" step for tap-based board entry — a brief highlight-then-tap-to-confirm to reduce fat-finger mis-scores, toggleable off for fast players.
9. Support keyboard shortcuts for desktop/laptop use (number keys + shift for doubles/trebles).
10. Add a persistent "average this leg" and "average needed to win" live indicator during X01.

### Setup & onboarding
11. Add a first-run guided setup (3–4 screens) explaining game modes, since the setup screen currently assumes darts-rules familiarity.
12. Add quick-start presets ("501, Double Out, Best of 5" as one tap) instead of always walking the full config flow.
13. Remember last-used ruleset per game type and pre-select it on next setup.
14. Add player search/autocomplete when adding players to a match, rather than only picking from the full roster list.
15. Add a "practice mode" one-tap entry from the home screen (solo, no opponent, checkout drills) — currently only reachable by configuring a full match.
16. Let users create a Killer/Cricket/X01 config as a named, reusable template.
17. Add clearer in-setup validation messaging (e.g. why 5v5 is capped at 10 total) instead of just disabling controls silently.

### Analytics & stats
18. Add a plain-language weekly/monthly summary card ("Your average is up 4.2 from last month") on top of the raw stat tables in `PlayerHistoryComparison.tsx`.
19. Add sortable/filterable match history (by game type, opponent, date range) — currently a flat chronological list.
20. Add an exportable/shareable match summary image (canvas-rendered scorecard) for socials, not just JSON export.
21. Add a checkout-percentage heatmap by score band (which ranges the player converts vs. blows) rather than a single aggregate checkout %.
22. Surface first-9 average prominently next to overall 3-dart average everywhere the latter appears, not just in the stats table.
23. Add a visible "personal best" banner the moment a stat is broken mid-match (highest turn, highest checkout, first 9-darter).

### Audio/visual polish
24. Add volume-independent mute-all toggle reachable from the in-match HUD, not only settings.
25. Let users pick from multiple available system TTS voices in-app (the code already collects `getAvailableVoices()` — surface it).
26. Add a "quiet mode" preset that disables voice announcer but keeps impact SFX, for late-night pub sessions.
27. Add visual "big number" celebration animations for 180/171/checkout, reusing the existing `canvas-confetti` dependency already in `package.json` but not yet wired to score events.
28. Add dark/light theme toggle — currently hardcoded dark (`zinc-950` etc.) throughout.
29. Add adjustable board size/scale for small-phone vs. tablet/TV chalkboard mode.

### Multiplayer & social (once real networking lands)
30. Add spectator links (read-only view of a live match) once real-time sync exists.
31. Add push notifications for "it's your turn" in async/turn-based online play.
32. Add friend/rival lists with quick head-to-head lookup from a player's profile.
33. Add match invites via shareable link/QR code instead of manually-typed room codes.

### Accessibility
34. Add screen-reader labels to the SVG dartboard segments (`InteractiveDartboard.tsx` currently has no `aria-label`s on interactive paths).
35. Add a colorblind-safe palette option for player colors (currently arbitrary hex per player, some low-contrast pairs like blue/purple).
36. Ensure all score announcements have a text-equivalent for hearing-impaired users (currently voice-only for some events).
37. Add adjustable font scaling for the chalkboard display mode, for visibility from a distance.

### Data & reliability
38. Add a visible "last synced" timestamp and manual "sync now" button near the auth/account UI, since sync currently happens silently in the background.
39. Add conflict handling messaging if `syncCloudHistory`/`syncLocalToCloud` ever disagree (currently silently merges, no user-facing indication).
40. Add local backup reminders (leverage the existing `exportData`) — e.g. a monthly nudge to export JSON, given match history is capped at 100 in the localStorage fallback path.
41. Raise or make configurable the localStorage fallback cap (`slice(0, 100)` in `storage.ts`) since IndexedDB users don't have this ceiling but localStorage-fallback users silently lose older matches.
42. Add a "matches pending sync" badge if offline, so users know cloud backup hasn't happened yet.

### Discoverability / navigation
43. Add in-app tooltips/help icons next to less-common formats (Shanghai, Bob's 27, Around the Clock) explaining the win condition inline.
44. Add a global search/command bar to jump to any player, past match, or setting quickly as match history grows.
45. Surface the AI Coach panel proactively at match end rather than requiring the user to know it exists and click into it.
46. Add breadcrumbs/back-navigation consistency across setup → match → post-match screens (currently relies on browser/back-button behavior in a few places).
47. Add a changelog/what's-new panel so returning users notice new features (Killer fix, real online play, etc. once shipped).

### Performance
48. Virtualize the match history and career-stats tables (`PlayerHistoryComparison.tsx`) once match counts grow past a few hundred, to avoid full-table re-renders.
49. Debounce/batch Firestore writes in `syncMatchToCloud` if a user is rapidly correcting entries (currently one `setDoc` per save call).
50. Lazy-load the `recharts`/analytics bundle only when the analytics tab is opened, rather than in the main bundle, to speed up initial match-screen load.
