#!/bin/bash
set -e

# Start Anvil in the background
anvil --load-state ./anvil-safe-state.json --block-time 1 > /dev/null 2>&1 &
ANVIL_PID=$!

trap "kill $ANVIL_PID" EXIT

# Run E2E tests (Synpress and Playwright)
USE_XVFB=1
ARGS=()
for arg in "$@"; do
  if [ "$arg" == "--ui" ]; then
    USE_XVFB=0
  fi
  ARGS+=("$arg")
done

if [ "$USE_XVFB" -eq 1 ]; then
  xvfb-run pnpm exec synpress
  xvfb-run pnpm exec playwright test "${ARGS[@]}"
else
  pnpm exec synpress
  pnpm exec playwright test "${ARGS[@]}"
fi
