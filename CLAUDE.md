# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

- Install deps: `bun install` (README documents Bun; `package-lock.json` is present, but Bun is the documented workflow)
- Start frontend dev server: `bun dev`
- Build frontend: `bun build`
- Preview production build: `bun preview`
- Lint: `bun lint`

## Convex backend workflow

- Start Convex dev sync: `npx convex dev`
- Deploy Convex functions/schema: `npx convex deploy`
- Open Convex dashboard/docs helper: `npx convex docs`

Environment variables expected by frontend/backend flows (from README and code):
- `VITE_CONVEX_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `OPENAI_API_KEY`
- `TASK_API_KEY` (server-side only, used by weekly report generation action)
- `TASK_API_BASE_URL` (optional, defaults to `https://accurate-shepherd-453.convex.site`)

## Tests

- No first-party test suite is configured in root `package.json`.
- `**/*.{test,spec}.*` matches only `node_modules` tests; there are currently no repository tests to run individually.

## High-level architecture

### Stack and runtime split
- Frontend: Vite + React 18 + TypeScript (`src/`)
- Backend/data: Convex queries/mutations/actions (`convex/`)
- Auth: Clerk (`src/main.tsx` wraps app in `ClerkProvider`)
- Realtime collaboration editor: Liveblocks + TipTap (`src/components/TipTapEditor.tsx`, `src/components/Editor.tsx`)
- AI: OpenAI chat completions streamed from Convex action (`convex/messages.ts`)

### Frontend app shape
- `src/main.tsx` wires providers: `ClerkProvider` + `ConvexProvider` around `App`.
- `src/App.tsx` is the main UI and router entry:
  - routes: `/`, `/admin`, `/mod`, `/about`, `/:slug`, and fallback
  - bootstraps a `default` page if missing, then sends system intro message
  - `MainApp` renders the primary product surface: page chat, todos, notes, and docs
- `src/pages/DynamicPage.tsx` resolves `:slug` -> page via Convex (`api.pages.getPageBySlug`) and gates inactive pages.
- `src/pages/admin.tsx` handles admin sign-in and redirects to `/mod` for users with `publicMetadata.role === "admin"`.
- `src/pages/mod.tsx` is the moderation/admin dashboard for per-page content management and CSV export.

### Data model and boundaries
Convex schema is in `convex/schema.ts`.

Core multi-page entities:
- `pages`: page namespace (`slug`, `title`, `isActive`)
- `pageMessages`: chat messages scoped to `pageId`
- `pageTodos`: todo/reminder items scoped to `pageId`
- `pageNotes`: note entries scoped to `pageId`
- `pageDocs`: saved document snapshots scoped to `pageId`

Legacy/global chat table:
- `messages`: older/global message + vector-search table still used for AI/search helpers and some legacy UI components.

Key practical distinction:
- Main UI (`MainApp`) reads/writes `pageMessages` + `pageTodos` + `pageNotes` (+ `docs` for documents).
- `messages` APIs still exist for AI orchestration/search and compatibility paths.

### Convex module responsibilities
- `convex/pages.ts`: page lifecycle (create, list, slug lookup, active toggle, delete page and associated page data)
- `convex/pageMessages.ts`: per-page chat CRUD, likes, bulk delete, CSV fetch support
- `convex/todos.ts` and `convex/pageTodos.ts`: overlapping todo handlers for page-scoped todos (the app currently calls `api.todos.*`)
- `convex/pageNotes.ts`: per-page notes CRUD + bulk delete/all-notes listing for admin
- `convex/docs.ts`: per-page document CRUD for editor snapshots
- `convex/messages.ts`: legacy/global messages, search, vector backfill, and AI streaming action (`askAI` -> `streamResponse`)
- `convex/cleanup.ts`: internal mutation that clears page/global content and reseeds system messages
- `convex/crons.ts`: schedules cleanup every 5 hours
- `convex/convex.config.ts`: registers `@convex-dev/prosemirror-sync` component

### AI and command-like chat behavior
In `src/App.tsx` message submit flow:
- `@ai ...` sends user message, then calls `api.messages.askAI`; Convex action streams response into a `pageMessages` row via patch updates.
- text containing `remind me` creates a todo (`api.todos.add`) and posts a system confirmation message.
- text starting with `note:` creates a note (`api.pageNotes.createNote`) and posts a system confirmation message.

### Collaboration docs behavior
- `TipTapEditor` initializes a Liveblocks room (`shared-doc`) and renders `Editor`.
- `Editor` persists docs in Convex `pageDocs` table (create/update/delete/list) and uses Liveblocks presence for collaborative title typing indicators.
- Editor currently resolves docs against the `default` page slug.

## Repo guidance from Cursor rules
From `.cursor/rules/convex.mdc` and `.cursor/rules/devtalk.mdc`, important repository-specific guidance:
- Follow Convex TypeScript and function best practices (typed args/returns, proper query/mutation/action usage).
- Prefer the newer Convex function declaration style with validators.
- Keep responses concise and implementation-focused.
