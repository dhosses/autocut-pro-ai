#!/bin/bash

# ─────────────────────────────────────────────────────────────
#  AutoCut Pro AI — Premiere Pro Extension Installer
#  Double-click this file to install the extension.
# ─────────────────────────────────────────────────────────────

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# Find the directory this script lives in (works when double-clicked)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSIONS_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
INSTALL_DEST="$EXTENSIONS_DIR/com.autocutproai.panel"
LIB_DIR="$SCRIPT_DIR/lib"
CSINTERFACE_URL="https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/CEP_11.x/CSInterface.js"

clear
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}${BOLD}║     AutoCut Pro AI — Plugin Installer    ║${RESET}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Installing Premiere Pro extension..."
echo ""

# ── Step 1: Download CSInterface.js ──────────────────────────
echo -e "  ${BOLD}[1/4]${RESET} Downloading CSInterface.js..."

mkdir -p "$LIB_DIR"

if curl -fsSL "$CSINTERFACE_URL" -o "$LIB_DIR/CSInterface.js" 2>/dev/null; then
  echo -e "        ${GREEN}✓ Downloaded${RESET}"
else
  echo -e "        ${YELLOW}⚠ Download failed — checking for cached copy...${RESET}"
  if [ ! -f "$LIB_DIR/CSInterface.js" ]; then
    echo -e "        ${RED}✗ CSInterface.js not found. Check your internet connection and try again.${RESET}"
    echo ""
    read -p "  Press Enter to close..."
    exit 1
  else
    echo -e "        ${GREEN}✓ Using cached copy${RESET}"
  fi
fi

# ── Step 2: Enable CEP debug mode ────────────────────────────
echo -e "  ${BOLD}[2/4]${RESET} Enabling Premiere Pro extension support..."

for VERSION in 12 11 10 9; do
  defaults write com.adobe.CSXS.$VERSION PlayerDebugMode 1 2>/dev/null
done

echo -e "        ${GREEN}✓ Debug mode enabled${RESET}"

# ── Step 3: Create extensions folder ─────────────────────────
echo -e "  ${BOLD}[3/4]${RESET} Setting up extensions folder..."

mkdir -p "$EXTENSIONS_DIR"
echo -e "        ${GREEN}✓ Ready${RESET}"

# ── Step 4: Install the extension ────────────────────────────
echo -e "  ${BOLD}[4/4]${RESET} Installing extension..."

# Remove old install if it exists
if [ -L "$INSTALL_DEST" ] || [ -d "$INSTALL_DEST" ]; then
  rm -rf "$INSTALL_DEST"
fi

# Symlink so code changes apply instantly (no reinstall needed)
ln -s "$SCRIPT_DIR" "$INSTALL_DEST"

if [ -L "$INSTALL_DEST" ]; then
  echo -e "        ${GREEN}✓ Installed${RESET}"
else
  echo -e "        ${RED}✗ Could not create symlink. Try running from terminal with sudo.${RESET}"
  read -p "  Press Enter to close..."
  exit 1
fi

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}  ✓ AutoCut Pro AI is installed!${RESET}"
echo ""
echo -e "  ${BOLD}Next steps:${RESET}"
echo -e "  1. ${YELLOW}Open (or restart) Adobe Premiere Pro${RESET}"
echo -e "  2. Go to  ${CYAN}Window → Extensions → AutoCut Pro AI${RESET}"
echo -e "  3. Sign in and open a sequence — you're ready to go"
echo ""
echo -e "  ${BLUE}Tip:${RESET} Any future updates to the plugin apply automatically."
echo -e "       Just close and reopen the panel in Premiere Pro."
echo ""

# Ask if they want to open Premiere Pro now
read -p "  Open Premiere Pro now? (y/n): " OPEN_PPRO
if [[ "$OPEN_PPRO" =~ ^[Yy]$ ]]; then
  open -a "Adobe Premiere Pro" 2>/dev/null || \
  open -a "Adobe Premiere Pro 2024" 2>/dev/null || \
  open -a "Adobe Premiere Pro 2023" 2>/dev/null || \
  open -a "Adobe Premiere Pro 2022" 2>/dev/null || \
  echo -e "  ${YELLOW}Could not find Premiere Pro — open it manually.${RESET}"
fi

echo ""
read -p "  Press Enter to close..."
