# Architecture

How EduCode works under the hood, and why it's built this way.

## Overview

EduCode is a thin layer on top of [VS Code](https://github.com/microsoft/vscode). Rather than building an IDE from scratch, we fork VS Code's open-source core and add three custom extensions that turn it into an educational environment. The fork is intentionally minimal — we change branding via `product.json` and bundle our extensions. Everything else is upstream VS Code.

```
VS Code (upstream)
├── product.json          ← EduCode branding + Open VSX marketplace
├── extensions/
│   ├── educode-media/    ← YouTube player sidebar
│   ├── educode-notes/    ← Note-taking + Obsidian sync
│   └── educode-welcome/  ← Welcome screen
└── (everything else is unmodified VS Code)
```

## Design Decisions

### Why fork VS Code instead of building from scratch?

Students already know VS Code. By building on top of it, they get a full IDE with IntelliSense, debugging, terminal, Git, and thousands of extensions — without us reimplementing any of it. Our custom extensions just add the educational workflow on top.

### Why iframe embeds instead of the YouTube Data API?

The YouTube Data API requires API keys, quota management, and OAuth for certain features. An iframe embed is simpler, works offline-ish (once loaded), and gives us the standard YouTube player controls for free. The tradeoff is that we need to strip YouTube's `X-Frame-Options` and CSP headers at the Electron level so iframes work inside VS Code's webview sandbox. We do this by intercepting Electron's `session.defaultSession.webRequest.onHeadersReceived` for YouTube domains only — it's surgical, not a blanket CSP disable.

We use `youtube-nocookie.com` for the embed domain, which is YouTube's enhanced privacy mode — no tracking cookies are set on the user's machine from video playback.

### Why Obsidian sync instead of just saving notes internally?

VS Code's `globalState` API persists extension data, but it's an opaque blob tied to the app. Students lose their notes if they reinstall, switch machines, or want to review notes outside the IDE.

By syncing to an Obsidian vault (a plain folder of `.md` files), notes become:
- **Portable** — they're just files on disk
- **Searchable** — Obsidian's graph view, backlinks, and search work on them
- **Version-controllable** — students can git-commit their vault
- **Readable anywhere** — any Markdown viewer or text editor works

The sync is one-directional (EduCode → vault). Each note becomes a `.md` file with YAML frontmatter in a `EduCode/` subfolder, keeping things tidy without polluting the vault root.

### Why webview panels instead of custom editor providers?

VS Code has two extension UI surfaces: webview panels (sidebar/tab) and custom editors. We use webview panels because:

1. **Sidebar placement** — the media player and notes panel sit in the activity bar alongside Explorer, Search, etc. This is natural for tools you glance at while coding.
2. **State persistence** — `retainContextWhenHidden` keeps the YouTube player running when you switch tabs. A custom editor would pause/destroy the iframe.
3. **Simplicity** — webview panels are self-contained HTML. No framework, no build step for the UI. The entire media player UI is ~250 lines of inline HTML/CSS/JS.

### Why Open VSX instead of the Microsoft Marketplace?

The [Microsoft Marketplace ToS](https://cdn.vsassets.io/v/M190_20210811.1/_content/Microsoft-Visual-Studio-Marketplace-Terms-of-Use.pdf) restricts usage to Microsoft products. Since EduCode is a VS Code fork (not VS Code itself), we use [Open VSX](https://open-vsx.org), the open-source alternative. Most popular extensions (C/C++, Python, etc.) are available on both.

## Extension Architecture

All three extensions follow the same pattern:

```
extension/
├── package.json        ← manifest: commands, keybindings, views
├── tsconfig.json       ← TypeScript config (CommonJS, ES2020)
├── src/
│   └── extension.ts    ← activate() + webview HTML as template literal
└── out/
    └── extension.js    ← compiled output (gitignored)
```

Each extension:
1. Registers a `WebviewViewProvider` for a sidebar panel
2. Returns inline HTML with `<style>` and `<script>` blocks
3. Communicates between webview ↔ extension via `postMessage`
4. Persists state via VS Code's `webviewView.webview.setState()` and `context.globalState`

There's no React, no bundler, no framework. The webview HTML uses VS Code's CSS custom properties (`var(--vscode-editor-background)`, etc.) to match the user's theme automatically.

### EduCode Media (`educode-media`)

```
User pastes URL → extractYouTubeId() → iframe src set → video plays
                                     → added to playlist (webview state)
```

The playlist lives in webview state (`vscode.getState()`), which survives panel hide/show cycles. Commands from the Command Palette (`Cmd+Shift+Y`) send messages to the webview via `postMessage`.

### EduCode Notes (`educode-notes`)

```
User types → debounced save (300ms) → webview state + globalState
                                    → if Obsidian configured: write .md to vault
```

Notes are stored as an array of `{id, title, content, createdAt, updatedAt}` objects. The Obsidian sync reads the vault path from VS Code settings (`educode.notes.obsidianVaultPath`) and writes each note as a Markdown file with YAML frontmatter tagged `[educode]`.

### EduCode Welcome (`educode-welcome`)

A one-time welcome tab shown on startup (configurable via `educode.welcome.showOnStartup`). Features a C++ typing animation and quick-action buttons that dispatch VS Code commands. No persistent state.

## YouTube Header Bypass

The trickiest part of EduCode. YouTube's embed pages set `X-Frame-Options: SAMEORIGIN` and strict CSP headers that prevent loading in an iframe from a non-YouTube origin (which is what a VS Code webview is).

We solve this at the Electron level:

```typescript
session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://*.youtube.com/*', 'https://*.youtube-nocookie.com/*'] },
    (details, callback) => {
        const headers = { ...details.responseHeaders };
        delete headers['x-frame-options'];
        delete headers['content-security-policy'];
        callback({ cancel: false, responseHeaders: headers });
    }
);
```

This runs in the main process before any response reaches the renderer. It only targets YouTube domains — all other sites keep their security headers intact. The patch is applied in `main.js` at app startup.

## File Sizes

The entire EduCode-specific codebase is small:

| File | Lines | Purpose |
|------|-------|---------|
| `educode-media/src/extension.ts` | ~350 | YouTube player |
| `educode-notes/src/extension.ts` | ~550 | Notes + Obsidian sync |
| `educode-welcome/src/extension.ts` | ~420 | Welcome screen |
| `product.json` | ~170 | Branding config |
| **Total** | **~1,500** | Everything custom in EduCode |

The rest is VS Code.
