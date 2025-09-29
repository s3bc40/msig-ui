echo "[E2E] Running E2E tests with Anvil"
#!/bin/bash
set -e

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
  echo "[E2E] Running in headless mode (xvfb)"
  echo "[E2E] Starting Anvil in the background..."
  echo ""
  # Start Anvil in the background
  anvil --load-state ./anvil-safe-state.json --block-time 1 > /dev/null 2>&1 &
  ANVIL_PID=$!

  trap "kill $ANVIL_PID" EXIT
  xvfb-run pnpm exec synpress
  xvfb-run pnpm exec playwright test "${ARGS[@]}"
else
  # You need to run anvil manually in another terminal if using --ui
  # useful if you need to restart anvil without restarting tests
  echo "[E2E] Running in UI mode (--ui)"
  echo "[E2E] Ensure Anvil is running in another terminal:"
  echo "      pnpm run anvil"
  echo ""
  pnpm exec synpress
  pnpm exec playwright test "${ARGS[@]}"
fi
