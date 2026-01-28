#!/bin/bash
# configure-githooks.sh - Set and validate Git hooks path

# Set hooks path
git config core.hooksPath .githooks

# Validate
HOOKS_PATH=$(git config core.hooksPath)
if [ "$HOOKS_PATH" = ".githooks" ]; then
    echo "✅ Git hooks path is correctly set to .githooks"
    exit 0
else
    echo "❌ Git hooks path is NOT set correctly. Current value: $HOOKS_PATH"
    exit 1
fi
