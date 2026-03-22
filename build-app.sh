#!/usr/bin/env bash
#
# build-app.sh — Build EduCode.app for macOS
#
# Usage:
#   ./build-app.sh          # Full build (compile + package)
#   ./build-app.sh compile  # Compile only (for dev)
#   ./build-app.sh package  # Package only (assumes already compiled)
#   ./build-app.sh extensions # Compile custom extensions only
#
set -e

# ── Environment ──────────────────────────────────────────────────
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Use nvm node if available
if [ -d "$HOME/.nvm/versions/node" ]; then
    NODE_DIR=$(ls -d "$HOME/.nvm/versions/node"/v22.* 2>/dev/null | sort -V | tail -1)
    if [ -n "$NODE_DIR" ]; then
        export PATH="$NODE_DIR/bin:$PATH"
    fi
fi
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$PATH"
export SHELL="${SHELL:-/bin/zsh}"

ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
    VSCODE_ARCH="arm64"
else
    VSCODE_ARCH="x64"
fi

echo "╔══════════════════════════════════════════╗"
echo "║        EduCode Build System              ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Node:     $(node --version)"
echo "  npm:      $(npm --version)"
echo "  Arch:     $VSCODE_ARCH"
echo "  Root:     $ROOT"
echo ""

# ── Helper Functions ─────────────────────────────────────────────

build_extensions() {
    echo "▸ Compiling custom extensions..."

    for ext in educode-media educode-notes educode-welcome; do
        local ext_dir="$ROOT/extensions/$ext"
        if [ -d "$ext_dir" ]; then
            echo "  → $ext"
            cd "$ext_dir"
            # Install deps if needed
            if [ ! -d "node_modules" ] && [ -f "package.json" ] && grep -q "devDependencies" package.json; then
                npm install --ignore-scripts 2>/dev/null || true
            fi
            # Compile TypeScript
            if [ -f "tsconfig.json" ]; then
                npx tsc 2>/dev/null || echo "    ⚠ TypeScript compilation had warnings"
            fi
        fi
    done

    cd "$ROOT"
    echo "  ✓ Extensions compiled"
    echo ""
}

compile_core() {
    echo "▸ Installing dependencies..."
    npm install 2>&1 | tail -3
    echo ""

    echo "▸ Compiling VS Code core + built-in extensions..."
    echo "  (this takes a few minutes on first build)"
    npm run compile 2>&1 | tail -5
    echo "  ✓ Core compiled"
    echo ""
}

patch_main_js() {
    echo "▸ Patching main.js with YouTube bypass bootstrap..."

    local MAIN_JS="$ROOT/out/main.js"
    local MAIN_ORIGINAL="$ROOT/out/main.original.js"

    # Back up original if not already backed up
    if [ ! -f "$MAIN_ORIGINAL" ]; then
        cp "$MAIN_JS" "$MAIN_ORIGINAL"
    fi

    # Check if already patched
    if head -5 "$MAIN_JS" | grep -q "EduCode Bootstrap"; then
        echo "  ✓ Already patched"
    else
        echo "  → Applying YouTube bypass patch..."
        local TEMP_FILE=$(mktemp)
        cat > "$TEMP_FILE" << 'BOOTSTRAP_EOF'
/*!--------------------------------------------------------
 * EduCode Bootstrap
 * - Strips CSP and X-Frame-Options from YouTube responses
 *   to enable iframe embeds in webview panels.
 *--------------------------------------------------------*/
import { app, session } from 'electron';

function patchYouTubeHeaders() {
    try {
        session.defaultSession.webRequest.onHeadersReceived(
            { urls: ['https://*.youtube.com/*', 'https://*.youtube-nocookie.com/*', 'https://*.googlevideo.com/*'] },
            (details, callback) => {
                const headers = { ...details.responseHeaders };
                delete headers['x-frame-options'];
                delete headers['X-Frame-Options'];
                delete headers['content-security-policy'];
                delete headers['Content-Security-Policy'];
                callback({ cancel: false, responseHeaders: headers });
            }
        );
        console.log('[EduCode] YouTube CSP headers patched');
    } catch (e) {
        console.error('[EduCode] Failed to patch headers:', e);
    }
}

if (app.isReady()) {
    patchYouTubeHeaders();
} else {
    app.on('ready', patchYouTubeHeaders);
}

/* ─── Original VS Code main.js follows ─── */

BOOTSTRAP_EOF
        cat "$MAIN_JS" >> "$TEMP_FILE"
        mv "$TEMP_FILE" "$MAIN_JS"
        echo "  ✓ Patched"
    fi
    echo ""
}

package_app() {
    echo "▸ Packaging EduCode.app for darwin-${VSCODE_ARCH}..."

    npm run gulp -- "package-darwin-${VSCODE_ARCH}" 2>&1 | tail -10
    echo ""

    local APP_DIR="$ROOT/.build/darwin/${VSCODE_ARCH}"
    local APP_NAME
    APP_NAME=$(node -p "require('./product.json').nameLong")

    if [ -d "$APP_DIR/$APP_NAME.app" ]; then
        echo "  ✓ App built at: $APP_DIR/$APP_NAME.app"

        echo "  → Copying to Desktop..."
        rm -rf "$HOME/Desktop/EduCode.app"
        cp -R "$APP_DIR/$APP_NAME.app" "$HOME/Desktop/EduCode.app"
        echo "  ✓ EduCode.app copied to ~/Desktop/"
    else
        echo "  ✗ App not found at expected path: $APP_DIR/$APP_NAME.app"
        echo "    Checking .build directory..."
        find "$ROOT/.build" -name "*.app" -maxdepth 4 2>/dev/null
    fi
    echo ""
}

setup_youtube_patch() {
    echo "▸ Setting up YouTube header patch..."

    local DATA_DIR="$HOME/.educode"
    mkdir -p "$DATA_DIR"

    cat > "$DATA_DIR/patch-headers.js" << 'PATCH_EOF'
// EduCode: Strip X-Frame-Options and CSP from YouTube responses
const { session } = require('electron');

function patchSession() {
    try {
        session.defaultSession.webRequest.onHeadersReceived(
            { urls: ['https://*.youtube.com/*', 'https://*.youtube-nocookie.com/*', 'https://*.googlevideo.com/*'] },
            (details, callback) => {
                const headers = { ...details.responseHeaders };
                delete headers['x-frame-options'];
                delete headers['X-Frame-Options'];
                delete headers['content-security-policy'];
                delete headers['Content-Security-Policy'];
                callback({ cancel: false, responseHeaders: headers });
            }
        );
        console.log('[EduCode] YouTube CSP headers patched');
    } catch (e) {
        console.error('[EduCode] Failed to patch headers:', e);
    }
}

const { app } = require('electron');
if (app.isReady()) {
    patchSession();
} else {
    app.on('ready', patchSession);
}
PATCH_EOF

    echo "  ✓ patch-headers.js written to $DATA_DIR/"
    echo ""
}

# ── Main ─────────────────────────────────────────────────────────

MODE="${1:-full}"

case "$MODE" in
    extensions)
        build_extensions
        ;;
    compile)
        build_extensions
        compile_core
        ;;
    package)
        build_extensions
        patch_main_js
        package_app
        setup_youtube_patch
        ;;
    full)
        build_extensions
        compile_core
        patch_main_js
        package_app
        setup_youtube_patch
        ;;
    *)
        echo "Usage: $0 [full|compile|package|extensions]"
        exit 1
        ;;
esac

echo "╔══════════════════════════════════════════╗"
echo "║        Build complete!                   ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "To run EduCode:"
echo "  open ~/Desktop/EduCode.app"
echo ""
echo "Or in dev mode:"
echo "  bash scripts/code.sh"
echo ""
