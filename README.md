# EduCode

**The Educational IDE — Code. Watch. Learn.**

EduCode is a VS Code-based IDE designed for students, with a built-in YouTube player, note-taking panel with Obsidian vault sync, and a custom welcome experience.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **YouTube Player** — Watch tutorials in a sidebar panel while you code (`Cmd+Shift+Y`)
- **Notes Panel** — Take notes alongside your code with auto-save (`Cmd+Shift+N`)
- **Obsidian Sync** — Notes automatically sync to your Obsidian vault as Markdown files
- **Welcome Screen** — Guided onboarding with quick actions and keyboard shortcuts
- **Open VSX Marketplace** — Install extensions from the open-source registry
- **Full VS Code** — Everything you know from VS Code, just built for learning

## Download

Grab the latest `.dmg` from the [Releases](https://github.com/DaltonTheDeveloper/EduCode-dist/releases) page.

1. Open the `.dmg`
2. Drag **EduCode** into **Applications**
3. Open EduCode and start coding

## Connecting Obsidian

1. Press `Cmd+Shift+P` → **"EduCode: Set Obsidian Vault Path"**
2. Select your Obsidian vault folder
3. Notes auto-sync to `YourVault/EduCode/` as `.md` files

See [SETUP.md](SETUP.md) for the full guide.

## Building from Source

EduCode is built on top of [VS Code](https://github.com/microsoft/vscode). To build from source:

### Prerequisites

- macOS (Apple Silicon or Intel)
- Node.js v22 (`nvm install 22`)
- Python 3.10+ (for DMG creation)
- Xcode Command Line Tools (`xcode-select --install`)

### Steps

```bash
# 1. Clone VS Code
git clone --depth 1 https://github.com/microsoft/vscode.git educode
cd educode

# 2. Clone EduCode customizations on top
git clone https://github.com/DaltonTheDeveloper/EduCode-dist.git /tmp/educode-overlay
cp /tmp/educode-overlay/product.json .
cp -R /tmp/educode-overlay/extensions/educode-* extensions/
cp /tmp/educode-overlay/build-app.sh .
cp /tmp/educode-overlay/build-educode.sh .

# 3. Build
npm install
./build-app.sh full
```

The packaged `EduCode.app` will be on your Desktop.

### Extensions Only

If you just want to compile the custom extensions:

```bash
./build-app.sh extensions
```

## Custom Extensions

| Extension | Shortcut | Description |
|-----------|----------|-------------|
| [EduCode Media](extensions/educode-media) | `Cmd+Shift+Y` | YouTube player sidebar panel |
| [EduCode Notes](extensions/educode-notes) | `Cmd+Shift+N` | Note-taking with Obsidian sync |
| [EduCode Welcome](extensions/educode-welcome) | — | Welcome screen on startup |

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Folder | `Cmd+O` |
| Save | `Cmd+S` |
| Command Palette | `Cmd+Shift+P` |
| Terminal | `` Cmd+` `` |
| YouTube Player | `Cmd+Shift+Y` |
| New Note | `Cmd+Shift+N` |

## License

[MIT](LICENSE.txt)

Built on [VS Code](https://github.com/microsoft/vscode) by Microsoft (MIT License).
