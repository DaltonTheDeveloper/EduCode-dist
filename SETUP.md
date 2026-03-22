# EduCode — Setup & Build Guide

EduCode is an educational IDE built on VS Code / VSCodium, with built-in YouTube player, note-taking, and Obsidian vault integration.

## Prerequisites

- **macOS** (Apple Silicon or Intel)
- **Node.js v22** (`nvm install 22`)
- **Python 3.10+** (for DMG creation only)
- **Xcode Command Line Tools** (`xcode-select --install`)

## Quick Start (Pre-built App)

If you already have `EduCode.app` on your Desktop, just open it:

```bash
open ~/Desktop/EduCode.app
```

## Building from Source

### 1. Compile Custom Extensions Only

```bash
./build-app.sh extensions
```

### 2. Full Dev Build (compile + run)

```bash
# Install dependencies & compile everything
npm install
npm run compile

# Compile custom extensions
./build-app.sh extensions

# Run in dev mode
bash scripts/code.sh
```

### 3. Package into EduCode.app

```bash
# Full build: compile everything + package into .app
./build-app.sh full

# Or if already compiled, just package:
./build-app.sh package
```

The built app will be copied to `~/Desktop/EduCode.app`.

## Custom Extensions

EduCode ships with three custom extensions:

| Extension | Shortcut | Description |
|-----------|----------|-------------|
| **EduCode Media** | `Cmd+Shift+Y` | YouTube player in the sidebar |
| **EduCode Notes** | `Cmd+Shift+N` | Note-taking panel with Obsidian sync |
| **EduCode Welcome** | — | Welcome screen on startup |

---

## Connecting Obsidian for Note-Taking

EduCode Notes can automatically sync your notes to an [Obsidian](https://obsidian.md) vault as Markdown files. This means every note you take in EduCode appears instantly in Obsidian (and vice versa for reading).

### Step 1: Open your Obsidian vault

Make sure you have an Obsidian vault set up. If you don't have one yet:

1. Download [Obsidian](https://obsidian.md)
2. Create a new vault (e.g., `~/Documents/MyVault`)

### Step 2: Connect EduCode to your vault

**Option A — Command Palette:**

1. Open EduCode
2. Press `Cmd+Shift+P` to open the Command Palette
3. Type **"EduCode: Set Obsidian Vault Path"**
4. Select your Obsidian vault folder in the file picker

**Option B — Settings:**

1. Open EduCode Settings (`Cmd+,`)
2. Search for **"obsidian"**
3. Set `Educode > Notes: Obsidian Vault Path` to your vault folder path
   - Example: `/Users/yourname/Documents/MyVault`
4. Ensure `Educode > Notes: Auto Sync To Obsidian` is checked (on by default)

### Step 3: Start taking notes

1. Click the **Notes** icon in the Activity Bar (or press `Cmd+Shift+N`)
2. Click **+ New** to create a note
3. Type your note — it auto-saves to both EduCode and your Obsidian vault

Notes are saved as Markdown files in an `EduCode/` subfolder inside your vault:

```
MyVault/
├── EduCode/
│   ├── Lecture 1 - Pointers.md
│   ├── Lab Notes.md
│   └── Study Guide.md
├── ... (your other Obsidian notes)
```

### Step 4: Sync existing notes

If you have notes from before connecting Obsidian:

1. Press `Cmd+Shift+P`
2. Type **"EduCode: Sync All Notes to Obsidian"**
3. All existing notes will be exported to your vault

### How it works

- Each note becomes a `.md` file with YAML frontmatter (id, timestamps, tags)
- Notes are tagged with `educode` for easy filtering in Obsidian
- Auto-sync writes on every save (debounced) — no manual export needed
- Deleting a note in EduCode also removes it from the vault
- The `EduCode/` subfolder keeps your notes organized without cluttering your vault

### Obsidian Graph View

Your EduCode notes will appear in Obsidian's graph view. You can link them to other notes using `[[wiki links]]` in your note content — Obsidian will recognize them automatically.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Folder | `Cmd+O` |
| Save | `Cmd+S` |
| Command Palette | `Cmd+Shift+P` |
| Terminal | `` Cmd+` `` |
| Play YouTube URL | `Cmd+Shift+Y` |
| New Note | `Cmd+Shift+N` |
| Insert Timestamp | (from Notes panel toolbar) |

## Extension Gallery

EduCode uses [Open VSX](https://open-vsx.org) as its extension marketplace, so you can install extensions like C/C++, Python, etc. from the Extensions sidebar.
