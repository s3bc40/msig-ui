# MSIG UI

A web interface for managing multisignature wallets inspired by SafeWallet and EternalSafeWallet. This is a 100% local safe wallet with multisig support, import/export, and transaction workflows.

- [MSIG UI](#msig-ui)
  - [Features](#features)
  - [Quickstart](#quickstart)
    - [Anvil State Management: --dump-state \& --load-state](#anvil-state-management---dump-state----load-state)
    - [Example: Test Runner Script](#example-test-runner-script)
    - [Example: Playwright Test (export)](#example-playwright-test-export)
  - [Developer Notes](#developer-notes)
  - [Deploying Safe Contracts Locally with `safe-smart-account`](#deploying-safe-contracts-locally-with-safe-smart-account)
  - [References](#references)

## Features

- **Safe Account Dashboard**: View Safe details, owners, threshold, nonce, and balance.
- **Transaction Workflow**: Create, import, export, and execute Safe transactions.
- **SafeWallet Data Import/Export**: Backup and restore address book, visited accounts, and undeployed safes.
- **Modal Interactions**: Deployment, broadcast, error, and import/export modals.
- **Wallet Connection**: MetaMask and RainbowKit integration.
- **Client-Side State**: All wallet and transaction logic is handled client-side using wagmi, RainbowKit, and Safe Protocol Kit.

## Quickstart

```
git clone https://github.com/s3bc40/msig-ui
cd msig-ui
pnpm install 
pnpm run dev
```

### Anvil State Management: --dump-state & --load-state

To ensure deterministic E2E tests, we use Anvil’s state management:

- After setting up contracts and accounts, run:
  ```sh
  anvil --dump-state ./anvil-safe-state.json
  ```
  This creates a snapshot of the chain state in `anvil-safe-state.json`.
- For all test runs, start Anvil with:
  ```sh
  anvil --load-state ./anvil-safe-state.json --block-time 1
  ```
  This restores the chain to the known state for reproducible tests.
- The test runner script and package.json use this approach:
  ```json
  "anvil": "anvil --load-state ./anvil-safe-state.json --block-time 1",
  "test:e2e": "bash tests/scripts/start-anvil-and-test.sh"
  ```

### Example: Test Runner Script

```bash
#!/bin/bash
set -e

# Start Anvil in the background
anvil --load-state ./anvil-safe-state.json --block-time 1 > /dev/null 2>&1 &
ANVIL_PID=$!
trap "kill $ANVIL_PID" EXIT

# Run E2E tests (Synpress and Playwright)
pnpm exec synpress
xvfb-run pnpm exec playwright test
```

### Example: Playwright Test (export)

```typescript
const exportBtn = page.locator('[data-testid="safe-dashboard-export-tx-btn"]');
await exportBtn.waitFor({ state: "visible" });
// Instead of waiting for download, use page.evaluate to get the exported JSON
const exportedJson = await page.evaluate(() => {
  // Expose exportTx to window for testing, or call directly if possible
  return window.exportTx && window.exportTx(window.safeAddress);
});
expect(exportedJson).toContain("expected data");
```

## Developer Notes

- All wallet and Safe logic is handled client-side for maximum privacy and flexibility.
- The project structure is modular, with reusable components and hooks.
- E2E tests require manual cache management when switching environments.
- For local contract deployment, see the instructions below.

## Deploying Safe Contracts Locally with `safe-smart-account`

To run your own local Safe contracts for development, follow these steps:

1. **Clone the Repository**
   ```sh
   git clone https://github.com/safe-global/safe-smart-account.git
   cd safe-smart-account
   ```
2. **Checkout the Correct Version**
   ```sh
   git checkout tags/v1.4.1-3
   ```
3. **Install Dependencies and Build**
   ```sh
   npm install
   npm run build
   ```
4. **Start a Local Anvil Node**
   ```sh
   anvil
   ```
5. **Create a `.env` File**
   ```ini
   MNEMONIC="test test test test test test test test test test test junk"
   NODE_URL="http://127.0.0.1:8545"
   ```
6. **Deploy Contracts**
   ```sh
   npx hardhat --network custom deploy
   ```
7. **Update Contract Addresses**
   - After deployment, copy the contract addresses from the output and update them in your project’s `localContractNetworks.ts` file.

> **Note:**
> Currently, contract addresses are manually maintained in `localContractNetworks.ts`. In the future, we may automate this process or use environment variables for better flexibility.

## References

- [SafeSDK: Protocol Kit](https://docs.safe.global/sdk/protocol-kit)
- [wagmi](https://wagmi.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [Synpress](https://docs.synpress.io/)
- [Playwright](https://playwright.dev/)
