#!/bin/bash
set -e

# Start Anvil in the background
anvil --load-state ./anvil-safe-state.json --block-time 1 > /dev/null 2>&1 &
ANVIL_PID=$!

# Ensure Anvil is killed on script exit or error
trap "kill $ANVIL_PID" EXIT

# Run E2E tests (Synpress and Playwright)
xvfb-run pnpm exec synpress
if [ -z "$1" ]; then
	xvfb-run pnpm exec playwright test
else
	xvfb-run pnpm exec playwright test "$1"
fi
