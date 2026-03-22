#!/bin/bash
# Resolve the repo root from this script's location
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Use nvm node if available, otherwise fall back to system PATH
if [ -d "$HOME/.nvm/versions/node" ]; then
    NODE_DIR=$(ls -d "$HOME/.nvm/versions/node"/v22.* 2>/dev/null | sort -V | tail -1)
    if [ -n "$NODE_DIR" ]; then
        export PATH="$NODE_DIR/bin:$PATH"
    fi
fi
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$PATH"
export SHELL="${SHELL:-/bin/zsh}"

echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo "PATH: $PATH"
cd "$ROOT"
"$@"
