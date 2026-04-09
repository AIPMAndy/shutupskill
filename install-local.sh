#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
DST_DIR="$HOME/.openclaw/skills/shutupskill"

mkdir -p "$DST_DIR"
cp "$SRC_DIR/SKILL.md" "$DST_DIR/"
cp "$SRC_DIR/index.js" "$DST_DIR/"
cp "$SRC_DIR/package.json" "$DST_DIR/"
cp "$SRC_DIR/README.md" "$DST_DIR/"
mkdir -p "$DST_DIR/backups"
chmod +x "$DST_DIR/index.js"

echo "installed: $DST_DIR"
echo "next: node $DST_DIR/index.js --status"
echo "important: restart gateway after install so OpenClaw reloads skill commands"
