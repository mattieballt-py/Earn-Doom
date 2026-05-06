# Earn-Doom Phased Build Plan

Source: [docs/prd.md](../docs/prd.md)

## Phase 1 - Core Blocking MVP
Goal: deliver the smallest useful desktop-only Instagram blocker with durable state.

### Scope
- Chrome extension MV3 shell.
- Instagram-only content detection on desktop web.
- Counter overlay in the top-right corner.
- Draggable overlay with persisted position.
- Random quota generation between 5 and 15 inclusive.
- Persistent storage for quota, count, blocked state, and session ID.
- Blocking mask that covers only content containers, not controls or composer entry points.
- Suppression of blocking during the create-post flow.

### Acceptance Criteria
- A user can browse Instagram content until the quota is reached.
- The overlay updates the count reliably across refreshes and sessions.
- The mask hides content while leaving buttons and creation controls usable.
- The user can still open + Create and begin composing a post when blocked.

### Dependencies
- Manifest and extension permissions.
- Reliable Instagram DOM heuristics.
- Local storage schema.

## Phase 2 - Creation Flow Robustness
Goal: make the create-post exemption and reset cycle dependable.

### Scope
- Better detection of Instagram composer open/close states.
- Reset when a post is published successfully.
- Guardrails so the blocker does not interfere with menus, buttons, or publishing controls.
- Better theme-aware styling for the overlay mask.

### Acceptance Criteria
- Publishing a post clears the block state and starts a fresh quota cycle.
- The create flow remains functional even after the quota is exhausted.
- The blocker does not cover actions required to finish posting.

### Dependencies
- Phase 1 counting and storage.
- Composer detection heuristics.

## Phase 3 - Hardening and Diagnostics
Goal: improve resilience against Instagram DOM changes and reduce breakage.

### Scope
- More defensive selectors and mutation observers.
- Internal logging or local diagnostics for detection failures.
- Optional local history of completed cycles.
- Manual recovery path if Instagram changes break the create flow.

### Acceptance Criteria
- The extension degrades safely when Instagram markup changes.
- Users can recover from detection failures without losing state.
- The core creation loop remains intact.

### Dependencies
- Phase 1 and Phase 2 behavior in production-like testing.

## Phase 4 - Optional Expansion
Goal: keep the product ready for later platform growth without committing scope now.

### Scope
- Review whether other platforms should be supported.
- Decide whether analytics should remain local or move to a backend.
- Consider whether content types should have different weights later.

### Acceptance Criteria
- Expansion decisions are based on validated usage of the Instagram MVP.
- No expansion work blocks the MVP release.

## Risks
- Instagram DOM changes may break content or composer detection.
- Aggressive counting may frustrate users if it increments at the wrong time.
- If the create flow is blocked, the product fails its core promise.

## Recommended Build Order
1. Implement storage and quota generation.
2. Implement content counting and overlay UI.
3. Add content-only masking.
4. Add create-flow exemption and reset logic.
5. Harden detection and add diagnostics.
