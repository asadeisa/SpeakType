# SpeakType

A browser extension for speech-to-text (Whisper-style transcription), backed by a small server.
The repo is a **pnpm monorepo** holding the extension, the backend, and shared code.

## Project structure

```
wissper-extanction/
├── apps/
│   ├── backend/        # Nuxt server (API / backend logic)
│   │   └── server/
│   │       └── agents/ # backend agent code (work in progress)
│   └── extension/      # Browser extension — WXT + Vue 3
├── packages/
│   └── shared/         # Code shared between backend & extension (@speaktype/shared)
├── doc/                # Project documentation
├── pnpm-workspace.yaml # Declares the workspaces (apps/*, packages/*)
└── package.json        # Root scripts that drive the whole repo
```

| Workspace               | Package name            | Stack            |
| ----------------------- | ----------------------- | ---------------- |
| `apps/backend`          | `@speaktype/backend`    | Nuxt 4           |
| `apps/extension`        | `@speaktype/extension`  | WXT + Vue 3      |
| `packages/shared`       | `@speaktype/shared`     | TypeScript       |

The apps depend on the shared package via `workspace:*`, so **pnpm is required** (it
resolves the workspace links and the `pnpm --filter` scripts).

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/)

## Setup

Install all dependencies once, from the repo root:

```powershell
pnpm install
```

## Running

Each app is its own process, so run them in **separate terminals**.

### Backend (Nuxt dev server)

```powershell
pnpm dev:backend
```

Serves at <http://localhost:3000> by default.

### Extension (WXT dev browser)

```powershell
pnpm dev:extension
```

WXT launches a browser with the extension loaded and hot-reloads on changes.

## All root scripts

| Command                  | What it does                                  |
| ------------------------ | --------------------------------------------- |
| `pnpm dev:backend`       | Run the Nuxt backend in dev mode              |
| `pnpm dev:extension`     | Run the extension in dev mode (WXT)           |
| `pnpm build`             | Build every workspace (`pnpm -r build`)       |
| `pnpm build:backend`     | Build only the backend                        |
| `pnpm build:extension`   | Build only the extension                      |
| `pnpm typecheck`         | Typecheck every workspace                     |
| `pnpm lint`              | Lint every workspace                          |

### Extension-only scripts

Run from `apps/extension` (or with `pnpm --filter @speaktype/extension <script>`):

| Command            | What it does                          |
| ------------------ | ------------------------------------- |
| `build:firefox`    | Build the extension for Firefox       |
| `zip`              | Package the extension as a `.zip`     |
