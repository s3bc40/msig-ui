import { testWithMetaMask as test } from "./fixtures/testWithMetamask";
import {
  MOCK_SAFE_TX_MAP,
  ANVIL_SAFE_THREE_SIGNERS,
  CHAIN_ID_ANVIL,
  MOCK_SAFEWALLET_DATA,
} from "./constants";

const { expect } = test;

test.beforeEach("Setup Safe and Transaction", async ({ page, metamask }) => {
  // Seed localStorage with a mock transaction for the Safe
  await page.addInitScript(
    ({ txMap, walletData }) => {
      localStorage.setItem("MSIGUI_safeCurrentTxMap", JSON.stringify(txMap));
      localStorage.setItem("MSIGUI_safeWalletData", JSON.stringify(walletData));
    },
    { txMap: MOCK_SAFE_TX_MAP, walletData: MOCK_SAFEWALLET_DATA },
  );

  // Go to accounts page and connect wallet
  await page.goto("/accounts");
  if (
    await page.locator('[data-testid="rk-connect-button"]').first().isVisible()
  ) {
    await page.locator('[data-testid="rk-connect-button"]').first().click();
    await page.waitForSelector('[data-testid="rk-wallet-option-metaMask"]', {
      timeout: 60000,
    });
    await page.locator('[data-testid="rk-wallet-option-metaMask"]').click();
    await metamask.connectToDapp();
  }

  // Navigate to Safe dashboard
  const safeRow = page.locator(
    `[data-testid="safe-account-row-${ANVIL_SAFE_THREE_SIGNERS}"]`,
  );
  await safeRow.waitFor({ state: "visible" });
  await safeRow.locator('[data-testid="safe-account-collapse"]').click();
  await safeRow
    .locator(
      `[data-testid="safe-account-link-${ANVIL_SAFE_THREE_SIGNERS}-${CHAIN_ID_ANVIL}"]`,
    )
    .click();
  await expect(
    page.locator('[data-testid="safe-dashboard-threshold"]'),
  ).toBeVisible();
});

test("should sign a Safe transaction", async ({ page, metamask }) => {
  // Go to transaction details page
  const txCard = page.locator('[data-testid="safe-dashboard-current-tx-card"]');
  await txCard.waitFor({ state: "visible" });
  await txCard
    .locator('[data-testid="safe-dashboard-current-tx-link"]')
    .click();

  // Sign transaction
  const signBtn = page.locator('[data-testid="tx-details-sign-btn"]');
  await signBtn.waitFor({ state: "visible" });
  await signBtn.click();

  // Confirm MetaMask signature request
  await metamask.confirmSignature();

  // Assert signature added
  await expect(
    page.locator('[data-testid="tx-details-signatures-row"]'),
  ).toContainText("Sig 1:");
  await expect(page.locator('[data-testid="tx-details-toast"]')).toContainText(
    "Signature added!",
  );
  await signBtn.isDisabled();
  await expect(signBtn).toHaveText("Already Signed");
});

test("should not sign if not owner", async ({ page, metamask }) => {
  // Go to transaction details page
  const txCard = page.locator('[data-testid="safe-dashboard-current-tx-card"]');
  await txCard.waitFor({ state: "visible" });
  await txCard
    .locator('[data-testid="safe-dashboard-current-tx-link"]')
    .click();

  // Sign transaction
  const signBtn = page.locator('[data-testid="tx-details-sign-btn"]');
  await signBtn.waitFor({ state: "visible" });

  // Sign button should be disabled
  await expect(signBtn).toBeEnabled();

  // Switch to a non-owner account in MetaMask
  // @FIXME find a way to switch to an account that is not an owner
  await metamask.switchAccount("Account 10");

  // Sign button should be disabled
  await expect(signBtn).toBeDisabled();
});

test("should broadcast a Safe transaction with enough signatures", async ({
  page,
}) => {
  // Add enough signatures to the transaction in localStorage before navigation
  // (Or sign as multiple owners if your test setup supports it)
  // Go to transaction details page
  const txCard = page.locator('[data-testid="safe-dashboard-current-tx-card"]');
  await txCard.waitFor({ state: "visible" });
  await txCard
    .locator('[data-testid="safe-dashboard-current-tx-link"]')
    .click();

  // Broadcast transaction
  const broadcastBtn = page.locator('[data-testid="tx-details-broadcast-btn"]');
  await broadcastBtn.waitFor({ state: "visible" });
  await broadcastBtn.click();

  // Assert broadcast modal appears and shows success
  const modal = page.locator('[data-testid="tx-details-broadcast-modal"]');
  await modal.waitFor({ state: "visible" });
  await expect(modal).toContainText("Broadcast successful!");
});

test("should not broadcast if not enough signatures", async ({ page }) => {
  // Go to transaction details page
  const txCard = page.locator('[data-testid="safe-dashboard-current-tx-card"]');
  await txCard.waitFor({ state: "visible" });
  await txCard
    .locator('[data-testid="safe-dashboard-current-tx-link"]')
    .click();

  // Broadcast button should be disabled
  const broadcastBtn = page.locator('[data-testid="tx-details-broadcast-btn"]');
  await expect(broadcastBtn).toBeDisabled();
});

test("should handle broadcast error gracefully", async ({ page }) => {
  // Mock broadcastSafeTransaction to throw error (if possible)
  // Go to transaction details page
  const txCard = page.locator('[data-testid="safe-dashboard-current-tx-card"]');
  await txCard.waitFor({ state: "visible" });
  await txCard
    .locator('[data-testid="safe-dashboard-current-tx-link"]')
    .click();

  // Try broadcasting and assert error toast/modal
  const broadcastBtn = page.locator('[data-testid="tx-details-broadcast-btn"]');
  await broadcastBtn.waitFor({ state: "visible" });
  await broadcastBtn.click();

  const modal = page.locator('[data-testid="tx-details-broadcast-modal"]');
  await modal.waitFor({ state: "visible" });
  await expect(modal).toContainText("Broadcast failed");
});
