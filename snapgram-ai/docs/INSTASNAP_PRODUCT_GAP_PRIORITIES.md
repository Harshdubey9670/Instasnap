# InstaSnap AI — Product Gap Prioritization & Roadmap
**Version:** 1.0.0-Phase-T  
**Planning Horizon:** Immediate (P0 Completed), Near-term (P1), Future Polish (P2)

---

## 1. Priority Framework

- **P0 — Security, IDOR, and Privacy Integrity (COMPLETED IN PHASE T)**: Any vulnerability leaking social graphs, exposing unauthenticated endpoints, or bypassing creator content permissions.
- **P1 — High Impact Social Capabilities**: Features expected in modern top-tier social applications (e.g. story stickers, advanced reel audio editing).
- **P2 — Optimization & Polish**: Offline media caching, enhanced analytics graphs, localized translations.

---

## 2. Status Tracking

### Priority P0: Security & Privacy Hardening (100% COMPLETE)
| Item | Components | Status | Verification |
| :--- | :--- | :--- | :--- |
| Follower List Privacy Gating | Server / Web / Mobile | **DONE** | Jest (57 tests) + Web/Mobile 403 handling |
| Following List Privacy Gating | Server / Web / Mobile | **DONE** | Jest (57 tests) + Web/Mobile 403 handling |
| User Profile IDOR Fix (Counts Only) | Server / Web / Mobile | **DONE** | Automated tests + Data schema contract |
| Creator-Controlled Story Downloads | Server / Web / Mobile | **DONE** | Endpoint `POST /stories/:id/download` + MediaLibrary |
| Creator-Controlled Reel Downloads | Server / Web / Mobile | **DONE** | Endpoint `POST /reels/:id/download` + MediaLibrary |
| Idempotent Real-time Download Alerts | Server Socket.IO | **DONE** | 60s window + Socket event tests |
| Web Privacy Settings Granular Selects | Web Client | **DONE** | Production bundle verified |
| Mobile Privacy Settings Granular Selects | React Native / Expo | **DONE** | TypeScript verified (0 errors) |

---

### Priority P1: Near-Term Enhancements
1. **Interactive Story Stickers**:
   - Polling sticker, Q&A sticker, Countdown timer.
   - Database model extension on `Story.stickers` array.
2. **Audio Track Extraction & Remixing**:
   - Extract original audio track from uploaded Reels for reuse in other creator reels.
3. **Multi-Account Quick Switcher Polish**:
   - One-tap account switching without relogin in Mobile header.

---

### Priority P2: Quality of Life & Polish
1. **Offline Feed Caching**:
   - Persist last 20 feed posts in SQLite/AsyncStorage for instant app launch on airplane mode.
2. **Advanced Analytics Visualizations**:
   - 30-day reach and impression charts in Creator Studio.
