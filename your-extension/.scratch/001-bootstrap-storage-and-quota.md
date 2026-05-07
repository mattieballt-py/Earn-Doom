### What to build
Set up the MV3 extension shell plus local state for current count, quota, blocked state, session ID, and overlay position, with a persisted random quota between 5 and 15 inclusive.

### Acceptance criteria
- The extension initializes a durable state record in browser storage.
- The active quota survives refreshes and browser restarts.
- A fresh cycle can be generated with a quota between 5 and 15 inclusive.

### Blocked by
- None - can start immediately

### Status
- Done
