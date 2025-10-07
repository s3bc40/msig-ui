import { test } from "./utils/fixture";
import {
  MOCK_SAFE_TX_MAP,
  ANVIL_SAFE_THREE_SIGNERS,
  CHAIN_ID_ANVIL,
  MOCK_SAFEWALLET_DATA,
  ANVIL_MM_ACCOUNTS,
} from "./utils/constants";
// import { signSafeTxWithAccounts } from "./utils/helpers";

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
    await metamask.connectToDapp(ANVIL_MM_ACCOUNTS);
    await metamask.switchAccount("Account 1");
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
  await metamask.switchAccount("Account 10");

  // Verify connected to non-owner account
  await expect(page.getByTestId("rk-account-button")).toBeVisible();
  await expect(page.getByTestId("rk-account-button")).toContainText("0xa0"); // Anvil Account 10
  await expect(page.getByTestId("rk-account-button")).not.toContainText(
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  ); // Account 1

  // Sign button should be disabled
  await expect(signBtn).toBeDisabled();
});

test("should broadcast a Safe transaction with enough signatures", async ({
  page,
  metamask,
}) => {
  // Go to transaction details page
  const txCard = page.locator('[data-testid="safe-dashboard-current-tx-card"]');
  await txCard.waitFor({ state: "visible" });
  await txCard
    .locator('[data-testid="safe-dashboard-current-tx-link"]')
    .click();

  // Check broadcast button
  const broadcastBtn = page.locator('[data-testid="tx-details-broadcast-btn"]');
  await broadcastBtn.waitFor({ state: "visible" });
  await expect(broadcastBtn).toBeDisabled();

  // Add enough signatures to the transaction in localStorage before navigation
  for (const [idx, accountName] of ANVIL_MM_ACCOUNTS.slice(0, 3).entries()) {
    // Init sign button
    const signBtn = page.locator('[data-testid="tx-details-sign-btn"]');

    if (accountName !== "Account 1") {
      // Wait for the sign button to be enabled and contain "Sign"
      await signBtn.waitFor({ state: "visible" });
      await expect(signBtn).toBeDisabled();
      await expect(signBtn).toHaveText("Already Signed");

      // Switch to a different owner account in MetaMask
      await metamask.switchAccount(accountName);
      // Add a small delay
      await page.waitForTimeout(300);

      // Verify that the sign button is enabled
      await expect(signBtn).toBeEnabled();
      await expect(signBtn).toHaveText("Sign Transaction");
    }

    // Sign transaction if button is enabled
    await signBtn.waitFor({ state: "visible" });
    await signBtn.click();

    // Confirm MetaMask signature request
    await metamask.confirmSignature();

    // Assert signature added
    const toastSig = await page.locator('[data-testid="tx-details-toast"]');
    await toastSig.waitFor({ state: "visible" });
    await expect(toastSig).toContainText("Signature added!");

    // Signature row should show the new signature
    const txSigRow = page.locator(
      `[data-testid="tx-details-signature-${idx}"]`,
    );
    await txSigRow.waitFor({ state: "visible" });
    await expect(txSigRow).toContainText(`Sig ${idx + 1}:`);

    // Wait for label to update
    await expect(signBtn).toHaveText("Already Signed");
    await expect(signBtn).toBeDisabled();
  }

  // Switch to the first account after signings
  await metamask.switchAccount("Account 1");
  await expect(page.locator('[data-testid="rk-account-button"]')).toBeVisible();
  await expect(page.locator('[data-testid="rk-account-button"]')).toContainText(
    "0xf3…2266D",
  ); // Anvil Account 1

  // Broadcast transaction
  await expect(broadcastBtn).toBeEnabled();
  await broadcastBtn.click();

  // Confirm MetaMask transaction request
  await metamask.confirmTransaction();

  // Assert broadcast modal appears and shows success
  const modal = page.locator('[data-testid="tx-details-broadcast-modal"]');
  await modal.waitFor({ state: "visible" });
  // Check for transaction hash row
  const txHashRow = modal.locator('[data-testid="broadcast-modal-txhash-row"]');
  await expect(txHashRow).toBeVisible();
  // Check for transaction hash itself
  const txHash = modal.locator('[data-testid="broadcast-modal-txhash"]');
  await expect(txHash).toBeVisible();
  // Check for success button
  const successBtn = modal.locator(
    '[data-testid="broadcast-modal-success-btn"]',
  );
  await expect(successBtn).toBeVisible();
  await successBtn.click();

  // Assert navigation back to Safe dashboard
  await page.waitForURL(`/safe/${ANVIL_SAFE_THREE_SIGNERS}`);
  await expect(page.url()).toContain(`/safe/${ANVIL_SAFE_THREE_SIGNERS}`);

  // Assert transaction no longer in current tx card
  const noTxCard = page.locator(
    '[data-testid="safe-dashboard-current-tx-card"]',
  );
  await expect(noTxCard).not.toBeVisible();

  // No longer in localStorage
  const txMap = await page.evaluate(() => {
    return localStorage.getItem("MSIGUI_safeCurrentTxMap");
  });
  const txMapObj = txMap ? JSON.parse(txMap) : {};
  expect(txMapObj[ANVIL_SAFE_THREE_SIGNERS]).toBeUndefined();
});
