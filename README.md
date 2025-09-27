# MSIG UI

A web interface for managing multisignature wallets inspired by SafeWallet and EternalSafeWallet.

## Project Objective

Create a 100% local safe wallet with multisig support, import/export, and transaction workflows.

## SafeWallet Inspiration & Libraries

This project is heavily inspired by SafeWallet from the Safe team. We use their official libraries:

- `@safe-global/protocol-kit`: Utility to interact with Safe contracts onchain (create, sign, execute transactions, fetch Safe info).
- `@safe-global/safe-deployments`: Provides deployment addresses for Safe contracts on various networks.

## Features

- **Safe Account Dashboard**: View Safe details, owners, threshold, nonce, and balance.
- **Transaction Workflow**: Create, import, export, and execute Safe transactions.
- **SafeWallet Data Import/Export**: Backup and restore address book, visited accounts, and undeployed safes.
- **Modal Interactions**: Deployment, broadcast, error, and import/export modals.
- **Wallet Connection**: MetaMask and RainbowKit integration.
- **Client-Side State**: All wallet and transaction logic is handled client-side using wagmi, RainbowKit, and Safe Protocol Kit.

## Project Structure

```bash
app/
  components/
    AppAddress.tsx
    AppCard.tsx
    AppSection.tsx
    BtnCancel.tsx
    DeploymentModal.tsx
    ImportSafeTxModal.tsx
    ImportSafeWalletModal.tsx
    Modal.tsx
    NavBar.tsx
    SafeDetails.tsx
    ...
  hooks/
    useSafe.ts
    useNewSafe.ts
  provider/
    SafeTxProvider.tsx
    SafeWalletProvider.tsx
  safe/
    [address]/
      SafeDashboardClient.tsx
      new-tx/
        NewSafeTxClient.tsx
      tx/
        [txHash]/
          TxDetailsClient.tsx
  accounts/
    AccountsSafeClient.tsx
  utils/
    constants.ts
    types.ts
    helpers.ts
...
tests/
  safe-account-dahsboard.spec.ts
  safe-wallet-export-import.spec.ts
  safe-account-create-tx.spec.ts
  fixtures/
    testWithMetamask.ts
  scripts/
    start-anvil-and-test.sh
...
.devcontainer/
  Dockerfile
  devcontainer.json
```

## Data & State Management

- The app is primarily client-side due to wagmi and RainbowKit.
- All Safe and wallet data is managed in React state and localStorage.
- No server-side rendering or TanStack Query cache hydration is used.
- Address book, Safe accounts, and transactions are stored locally and can be imported/exported as JSON.

### Example: Export Safe Transaction

```tsx
// In SafeDashboardClient.tsx
<button
  className="btn btn-primary btn-outline btn-sm"
  data-testid="safe-dashboard-export-tx-btn"
  onClick={() => {
    if (!currentTx) return;
    try {
      const json = exportTx(safeAddress);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `safe-tx.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Optionally show error toast
    }
  }}
  title="Export transaction JSON to file"
  disabled={!currentTx}
>
  Export Tx
</button>
```

### Example: Import Safe Transaction Modal

```tsx
// Usage of ImportSafeTxModal in SafeDashboardClient.tsx
<ImportSafeTxModal
  open={showImportModal}
  onClose={() => {
    setShowImportModal(false);
    setImportPreview(null);
  }}
  importPreview={importPreview}
  onReplace={async () => handleImportTx(importPreview)}
/>
```

## Devcontainer Setup

- Uses the official Playwright base image for browser automation.
- Installs Xvfb for virtual display (headed browser UI is WIP and may not work reliably).
- All dependencies are installed for the non-root user to avoid permission issues.
- Foundry/anvil is installed for local Ethereum testing.
- See `.devcontainer/Dockerfile` and `.devcontainer/devcontainer.json` for details.

**Note:**  
When switching between local and devcontainer environments, developers must manually reset the `.cache-synpress` directory before running tests to avoid browser/extension cache conflicts.

### Example: Devcontainer Dockerfile (snippet)

```dockerfile
FROM mcr.microsoft.com/playwright:v1.48.2-noble
# ...
RUN apt-get update && apt-get install -y xvfb
# ...
USER ubuntu
RUN corepack enable && corepack prepare pnpm@latest --activate
# ...
```

## E2E Testing

- Tests are written using Synpress (MetaMask automation) and Playwright.
- Test scripts are located in `tests/` and cover Safe account creation, dashboard, wallet import/export, and transaction workflows.
- The test runner script (`tests/scripts/start-anvil-and-test.sh`) starts Anvil, runs Synpress, and then Playwright tests.
- UI-based tests in the devcontainer are a work in progress; headed mode may not display correctly due to Xvfb/browser limitations.

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
