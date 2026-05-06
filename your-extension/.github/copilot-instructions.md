name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding.

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree resolving dependencies between decisions one by one. If a question can be answered by exploring the codebase, explore the codebase instead. For each question, provide your recommended answer.

name: to-prd
description: Turn the current conversation context into a PRD. Use when user wants
to create a PRD from the current context. Do NOT interview the user — just synthesize
what you already know.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already.

2. Sketch out the major modules you will need to build or modify to complete the
implementation. Actively look for opportunities to extract deep modules that can be
tested in isolation.

A deep module (as opposed to a shallow module) is one which encapsulates a lot of
functionality in a simple, testable interface which rarely changes.

Check with the user that these modules match their expectations. Check with the user
which modules they want tests written for.

3. Write the PRD using the template below and save it to docs/prd.md.

## PRD Template

### Problem Statement
The problem that the user is facing, from the user's perspective.

### Solution
The solution to the problem, from the user's perspective.

### User Stories
A LONG, numbered list of user stories. Each user story should be in the format:
"As a [user], I want [feature], so that [benefit]."
This list should be extremely extensive and cover all aspects of the feature.

### Implementation Decisions
A list of implementation decisions that were made. This can include:
- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets.

### Testing Decisions
A list of testing decisions that were made. Include:
- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

### Out of Scope
A description of the things that are out of scope for this PRD.

### Further Notes
Any further notes about the feature.

name: prd-to-plan
description: Turn a PRD into a multi-phase implementation plan using tracer-bullet
vertical slices. Use when user wants to break a PRD into a build plan, or create
phases for implementation. Output the plan to ./plans/

## Process

1. Read the PRD from docs/prd.md (or from the current conversation context).

2. Break the work into phases using TRACER BULLET vertical slices.
   Each phase cuts through ALL integration layers end-to-end.
   NOT horizontal slices of one layer.

   Each slice:
   - Delivers a narrow but COMPLETE path through every layer
   - Is demoable or verifiable on its own
   - Represents a thin feature from UI through to storage

3. Identify dependencies between phases. Structure them as a DAG
   (directed acyclic graph) — independent phases can be run in parallel.

4. Present the phased plan to the user and confirm granularity feels right.
   Iterate until approved.

5. Save the final plan to ./plans/plan.md

name: to-issues
description: Break a plan, spec, or PRD into independently-grabbable issues using
tracer-bullet vertical slices. Use when user wants to convert a plan into issues,
create implementation tickets, or break down work into issues.

## Process

1. Work from whatever is already in the conversation context.

2. Break the plan into TRACER BULLET issues. Each issue is a thin vertical slice
that cuts through ALL integration layers end-to-end, NOT a horizontal slice of
one layer.

   Slices may be 'HITL' (requires human input) or 'AFK' (agent can complete solo).
   Prefer AFK over HITL where possible.

   - Each slice delivers a narrow but COMPLETE path through every layer (e.g. storage, logic, UI, tests)
   - A completed slice is demoable or verifiable on its own
   - Prefer many thin slices over few thick ones

3. Present the proposed breakdown as a numbered list. For each slice, show:
   - Title: short descriptive name
   - Type: HITL / AFK
   - Blocked by: which other slices (if any) must complete first

4. Ask the user:
   - Does the granularity feel right?
   - Are the dependency relationships correct?
   - Should any slices be merged or split further?

5. Save approved issues to .scratch/ as individual markdown files,
   or create GitHub Issues if the repo is connected.

## Issue Template

### What to build
A concise description of this vertical slice. Describe the end-to-end behavior,
not layer-by-layer implementation.

### Acceptance criteria
- Criterion 1
- Criterion 2
- Criterion 3

### Blocked by
- Blocked by #[issue] (if any)
Or: "None - can start immediately"

name: tdd
description: Test-driven development with red-green-refactor loop. Use when user
wants to build features or fix bugs using TDD, mentions "red-green-refactor",
wants integration tests, or asks for test-first development.

## Philosophy

Core principle: Tests should verify behavior through public interfaces, not
implementation details. Code can change entirely; tests shouldn't.

Good tests are integration-style: they exercise real code paths through public APIs.
They describe WHAT the system does, not HOW it does it.

Bad tests are coupled to implementation. They mock internal collaborators, test
private methods, or verify through external means.

## Anti-Pattern: DO NOT write all tests first, then all implementation.

WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  ...

## Workflow

### 1. Planning
Before writing any code:
- Confirm with user what interface changes are needed
- Confirm with user which behaviors to test (prioritize)
- List the behaviors to test (not implementation steps)
- Get user approval on the plan

### 2. Tracer Bullet
Write ONE test that confirms ONE thing about the system:
  RED:   Write test for first behavior → test fails
  GREEN: Write minimal code to pass → test passes

### 3. Incremental Loop
For each remaining behavior:
  RED:   Write next test → fails
  GREEN: Minimal code to pass → passes

Rules:
- One test at a time
- Only enough code to pass current test
- Don't anticipate future tests
- Keep tests focused on observable behavior

### 4. Refactor
After all tests pass:
- Extract duplication
- Deepen modules (move complexity behind simple interfaces)
- Run tests after each refactor step
- NEVER refactor while RED. Get to GREEN first.

## Checklist Per Cycle
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added

name: diagnose
description: Disciplined diagnosis loop for hard bugs and performance regressions.
Reproduce → minimise → hypothesise → instrument → fix → regression-test.
Use when user says "diagnose this" / "debug this", reports a bug, says something
is broken/throwing/failing, or describes a performance regression.

## Phase 1 — Build a feedback loop

This is the skill. If you have a fast, deterministic, agent-runnable pass/fail signal
for the bug, you will find the cause. If you don't, no amount of staring at code will help.

Ways to construct one (try in this order):
1. Failing test at whatever seam reaches the bug
2. Curl / HTTP script against a running dev server
3. CLI invocation with a fixture input, diffing stdout against a known-good snapshot
4. Headless browser script (Playwright / Puppeteer)
5. Replay a captured trace
6. Throwaway harness (minimal subset of the system)
7. Property / fuzz loop (run 1000 random inputs)
8. Bisection harness (git bisect)

Do not proceed to Phase 2 until you have a loop you believe in.

## Phase 2 — Reproduce
Run the loop. Watch the bug appear. Confirm it matches what the user described.

## Phase 3 — Hypothesise
Generate 3–5 ranked hypotheses before testing any of them.
Each hypothesis must be falsifiable: state the prediction it makes.
Format: "If [X] is the cause, then [Y] will make the bug disappear."
Show the ranked list to the user before testing.

## Phase 4 — Instrument
Each probe must map to a specific prediction from Phase 3.
Change one variable at a time.
Tag every debug log with a unique prefix e.g. [DEBUG-a4f2]. Cleanup = one grep.

## Phase 5 — Fix + regression test
Write the regression test BEFORE the fix.
1. Turn the minimised repro into a failing test
2. Watch it fail
3. Apply the fix
4. Watch it pass
5. Re-run the Phase 1 feedback loop

## Phase 6 — Cleanup + post-mortem
- Original repro no longer reproduces
- All [DEBUG-...] instrumentation removed
- The hypothesis that turned out correct is stated in the commit message
- Ask: what would have prevented this bug?

name: improve-codebase-architecture
description: Find deepening opportunities in a codebase. Use when the user wants
to improve architecture, find refactoring opportunities, consolidate tightly-coupled
modules, or make a codebase more testable and AI-navigable.

## Goal
Surface architectural friction and propose deepening opportunities — refactors that
turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Key concepts
- Deep module: lots of behaviour behind a small interface (high leverage)
- Shallow module: interface nearly as complex as the implementation (low leverage)
- Deletion test: imagine deleting the module. If complexity vanishes, it was a
  pass-through. If complexity reappears across N callers, it was earning its keep.

## Process

### 1. Explore
Walk the codebase organically and note where you experience friction:
- Where does understanding one concept require bouncing between many small files?
- Where are modules shallow — interface nearly as complex as the implementation?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test?

Apply the deletion test to anything you suspect is shallow.

### 2. Present candidates
Present a numbered list of deepening opportunities. For each:
- Files: which files/modules are involved
- Problem: why the current architecture is causing friction
- Solution: plain English description of what would change
- Benefits: in terms of testability and navigability

Do NOT propose interfaces yet. Ask: "Which of these would you like to explore?"

### 3. Grilling loop
Once the user picks a candidate, drop into a grilling conversation.
Walk the design tree with them — constraints, dependencies, the shape of the
deepened module, what sits behind the seam, what tests survive.