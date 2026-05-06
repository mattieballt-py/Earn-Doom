# Product Requirements Document

## Overview
Earn-Doom is a desktop-only Chrome extension for creators who use Instagram for inspiration but want to limit passive consumption. The extension counts pieces of content consumed on Instagram web, then blocks further browsing after a randomly chosen quota is reached. To continue, the user must create and publish a new post, after which the counter resets and the browsing limit restarts.

The product is intentionally opinionated: it is not a general productivity blocker, and it is not meant to support every social platform at launch. Instagram is the only MVP surface because it is the client's current posting channel and the largest source of unstructured scrolling.

## Goals
- Reduce doomscrolling on Instagram while preserving content consumption as a source of creative inspiration.
- Encourage creation behavior by tying continued access to publishing new content.
- Make the restriction feel game-like rather than purely punitive through a randomized quota.
- Persist the user's progress across browser sessions so the constraint is durable.

## Non-Goals
- Mobile support in the first release.
- Support for platforms other than Instagram in the MVP.
- Monetization, subscriptions, or paid tiers.
- Full behavioral tracking or heavy analytics infrastructure at launch.

## Target User
- Gen Z and users in their 20s who create content daily.
- People who use Instagram for inspiration but also lose time to passive consumption.
- Creators who are motivated by visible goals, friction, and lightweight gamification.

## User Problem
Creators often open Instagram to research, reference, or get inspired, then stay in a consumption loop longer than intended. The product should interrupt that loop after a bounded amount of exposure and force a creative reset instead of relying on self-control alone.

## MVP Scope
### In Scope
- Desktop Chrome extension for Instagram web only.
- A top-right draggable overlay that displays the current consumption count and limit.
- Random quota generation between 5 and 15 content pieces per session.
- Persistent progress stored across browser sessions.
- Detection of Instagram feed consumption across posts, stories, and short-form videos.
- A blocking overlay that masks Instagram content once the quota is reached.
- A creation flow exemption so the user can open the Instagram post composer without being blocked.
- Counter reset after the user publishes a new post.

### Out of Scope
- Instagram mobile app support.
- Multi-account management.
- Cross-device sync.
- Remote analytics backend.

## Functional Requirements
### Content Counting
- The extension must count individual pieces of content consumed on Instagram web.
- A piece of content includes a post, story, reel, or equivalent single item presented to the user.
- The counter should increment when the user advances to a new content item or when a new item becomes the active visible focus in the feed or viewer.
- The counter value and current quota must persist using browser storage so refreshes and new sessions do not reset the user's progress.

### Quota Generation
- When a new cycle starts, the extension must generate a quota between 5 and 15 inclusive.
- The quota should remain fixed for that cycle.
- The randomized number is intended as a game mechanic, not a security feature.

### Blocking Behavior
- When the counter reaches the quota, the extension must block further passive Instagram content consumption.
- The mask should visually cover Instagram content in a way that matches the user's theme context.
- If the page is in dark appearance, the overlay should be dark; if light, the overlay should be light.
- The overlay should remain visible until the user completes the reset action by publishing a post.

### Draggable Overlay
- The counter UI must be anchored in the top-right corner by default.
- The user must be able to drag the overlay to another position.
- The overlay position should persist across sessions.

### Creation Exception
- The extension must not interfere with the Instagram post creation flow.
- The user must be able to open the + Create composer and complete a post.
- While the composer is active, blocking overlays should be suppressed.
- After publishing, the extension must clear the block state and reset the counter to zero with a new quota.

## Instagram Detection Strategy
Instagram web does not expose a stable official event model for every content interaction the extension needs. The MVP should therefore use a resilient heuristic approach rather than depending on one brittle selector.

Recommended detection signals:
- Feed and viewer DOM observation to detect when a new card, story frame, or reel becomes the active item.
- URL and route changes inside Instagram web where applicable.
- MutationObserver-based detection for composer modal open/close states.
- Guardrails that pause counting while the composer or publishing flow is active.

Implementation note:
- The + Create flow can usually be detected by observing the composer button, the modal dialog it opens, and route/DOM changes associated with the post editor.
- There is no guarantee that Instagram will expose stable post events, so the system should be tolerant of DOM changes and should fail closed in a way that avoids breaking posting.

## Analytics
### What to Track
- Number of content pieces consumed per cycle.
- Quota completion rate.
- Number of times the user reaches the block state.
- Number of successful reset events after posting.
- Overlay drag interactions if useful for UX tuning.

### How Tracking Works
For the MVP, analytics should not require a database.
- Local-only tracking is sufficient for internal validation and personal use.
- The extension can store event counts and session summaries in browser storage.
- If future remote analytics are needed, a backend database would be introduced later to aggregate events across users and devices.

### Recommendation
- Do not build a database now unless the product needs cross-device sync, remote dashboards, or cohort analysis.
- Start with local event summaries and optionally add opt-in telemetry later if the project moves beyond a single-client prototype.

## Data Model
- `currentCount`: number of consumed pieces in the active cycle.
- `quota`: randomized limit for the active cycle.
- `blocked`: whether the overlay block state is active.
- `overlayPosition`: saved x/y position for the draggable UI.
- `sessionId`: identifier for the current consumption cycle.
- `history`: optional local summary of prior cycles.

## Success Metrics
- Users can sustain repeated cycles of consume -> create -> reset without the extension breaking.
- The block state triggers reliably after quota completion.
- The composer flow remains functional.
- The overlay remains usable and does not materially interfere with legitimate creation.
- The product reduces unbounded passive scrolling for its target creator audience.

## Risks
- Instagram DOM changes may break detection logic.
- Overly aggressive counting may frustrate users if the extension increments too quickly.
- If the create-flow exemption is unreliable, the extension could block posting, which would undermine trust.
- Theme detection may not perfectly match all Instagram states.

## Open Questions
- Should reels, stories, and feed posts all count equally, or should some content types have different weights later?
- Should the quota reset immediately after posting, or only after the post is confirmed published and visible?
- Should there be a manual emergency unlock for cases where Instagram's DOM changes break the create flow?

## Suggested Delivery Phases
### Phase 1
- Desktop-only Instagram counting and quota enforcement.
- Persistent local state.
- Draggable overlay.
- Blocking mask.

### Phase 2
- Better create-flow detection and improved resilience to DOM changes.
- Optional local history and reporting.

### Phase 3
- Broader platform support if Instagram succeeds and the concept proves valuable.
