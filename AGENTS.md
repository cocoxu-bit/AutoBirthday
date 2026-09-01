<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AutoBirthday Senior Engineering Standards & Quality Gates
*(Inspired by Addy Osmani's agent-skills production framework)*

## 1. Anti-Rationalization Protocol (Zero Assumptions & Zero Shortcuts)
AI coding assistants are prone to taking the shortest path to perceived task completion. You MUST strictly adhere to these quality gates:

- **Verification over Assumption**: Never conclude that code works solely based on static reasoning or visual inspection. Execute real test scripts (`npx tsx`) or verify live API/database states.
- **Defensive by Default**: Every external I/O (Evolution API, WhatsApp Baileys, Firebase Firestore, Google Gemini) MUST have:
  - Strict timeout controls via `AbortController` (max 3–6s).
  - Explicit error handling with meaningful context logging (no empty `catch {}` blocks).
  - Built-in fallback strategies for disconnected, rate-limited, or empty states.
- **Rate-Limit & Concurrency Defenses**: When querying batch WhatsApp/Baileys endpoints (groups, chats, photos), enforce sequential throttling (min 150–200ms spacing) to prevent `404 rate-overlimit` errors.
- **Build Integrity Gate**: Every feature, refactor, or bugfix MUST pass `npm run build` with exit code 0 before concluding the task.

---

## 2. The 6-Stage Engineering Lifecycle

### 1. DEFINE (Contracts & Edge Cases)
- Define exact TypeScript types, inputs, outputs, and edge cases upfront.
- **Mandatory Edge Cases Checklist**:
  - Empty or single-item datasets (`0` vs `1` vs `500+`).
  - International phone number formatting (e.g., `+54 9 11`, `+34`, leading zeroes, non-digit artifacts).
  - Emojis, special unicode, or multiline strings in names, notes, and messages.
  - Privacy identifiers (`@lid`), broadcast newsletters (`@newsletter`), and group chats (`@g.us`).

### 2. PLAN (Architecture & Non-Breaking Design)
- **Zero-Downtime Cache Swaps**: Never purge or delete active collections before new data is safely written and verified.
- **Phase-Split Streaming**: Fast local initial load (<50ms for initial items) followed by background chunked streaming for large lists.
- Decouple long-running synchronization or background polling from synchronous server action response cycles.

### 3. BUILD (Clean Code & Separation of Concerns)
- Keep functions modular, well-named, and focused on a single responsibility.
- Use guard clauses early to reduce nested `if/else` blocks.
- Maintain type safety without unconstrained `any` types in core domain interfaces.

### 4. VERIFY (Execution Testing)
- Run isolated test scripts using `npx tsx` against live data to validate edge cases.
- Confirm math consistency in all UI diagnostic counters and summary cards (e.g. `101 = 38 groups + 23 lids + 2 newsletters + 38 direct`).

### 5. REVIEW (Security & Auth Audits)
- Ensure all mutations and Server Actions verify user authentication and authorization.
- Admin endpoints must verify admin claims/tokens and enforce audit logging.
- Ensure cookies use `httpOnly`, `secure`, `sameSite: 'lax'`, and appropriate expiration.

### 6. SHIP (Deploy Verification)
- Run `npm run build` and ensure zero TypeScript, webpack, or linter errors.
- Commit with conventional commit messages (`feat:`, `fix:`, `refactor:`, `perf:`).
- Verify deployment health post-push.

