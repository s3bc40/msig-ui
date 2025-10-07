import fs from "fs";
import { test } from "./utils/fixture";
import {
  ANVIL_SAFE_THREE_SIGNERS,
  CHAIN_ID_ANVIL,
  MOCK_SAFE_TX_SIGNED_MAP,
  MOCK_SAFEWALLET_DATA,
} from "./utils/constants";

const { expect } = test;

test.beforeEach("Setup", async ({ page, metamask }) => {
  // Seed localStorage before page load
  await page.addInitScript(
    ({ data }) => {
      localStorage.setItem("MSIGUI_safeWalletData", JSON.stringify(data));
    },
    { data: MOCK_SAFEWALLET_DATA },
  );

  // Go to accounts page and click the Safe row link for the correct chain/address
  await page.goto("/accounts");

  // Connect wallet if not already connected
  if (await page.getByTestId("rk-connect-button").first().isVisible()) {
    await page.getByTestId("rk-connect-button").first().click();
    await page.waitForSelector('[data-testid="rk-wallet-option-metaMask"]', {
      timeout: 60000,
    });
    await page.getByTestId("rk-wallet-option-metaMask").click();
    await metamask.connectToDapp();
  }
});

// Transaction workflow test for Safe page
test("should redirect to safe dashboard on click on account row", async ({
  page,
}) => {
  // Expand the safe account row if needed
  const safeRow = page.getByTestId(
    `safe-account-row-${ANVIL_SAFE_THREE_SIGNERS}`,
  );
  await safeRow.waitFor({ state: "visible" });
  const collapseCheckbox = safeRow.getByTestId("safe-account-collapse");
  await collapseCheckbox.waitFor({ state: "visible" });
  await collapseCheckbox.click();
  // Now click the safe link for the correct chain/address
  const safeRowLink = safeRow.getByTestId(
    `safe-account-link-${ANVIL_SAFE_THREE_SIGNERS}-${CHAIN_ID_ANVIL}`,
  );
  await safeRowLink.waitFor({ state: "visible" });
  await safeRowLink.click();

  // Assert SafeDashboardClient key elements are visible
  await expect(page.getByTestId("safe-dashboard-threshold")).toBeVisible();
  await expect(page.getByTestId("safe-dashboard-owners")).toBeVisible();
  await expect(page.getByTestId("safe-dashboard-nonce")).toBeVisible();
  await expect(page.getByTestId("safe-dashboard-balance")).toBeVisible();
  await expect(page.getByTestId("safe-dashboard-divider")).toBeVisible();
});

test("should export Safe transaction JSON and verify file content", async ({
  page,
}) => {
  // Seed localStorage before page load with mock SafeTx data
  await page.addInitScript(
    ({ txMap }) => {
      localStorage.setItem("MSIGUI_safeCurrentTxMap", JSON.stringify(txMap));
    },
    { txMap: MOCK_SAFE_TX_SIGNED_MAP },
  );

  // Reload the page to ensure the script runs and reconnect wallet if needed
  await page.reload();
  if (
    await page.locator('[data-testid="rk-connect-button"]').first().isVisible()
  ) {
    await page.locator('[data-testid="rk-connect-button"]').first().click();
    await page.waitForSelector('[data-testid="rk-wallet-option-metaMask"]', {
      timeout: 60000,
    });
    await page.locator('[data-testid="rk-wallet-option-metaMask"]').click();
  }

  // Click the Safe row link for the correct chain/address
  const safeRow = page.locator(
    `[data-testid="safe-account-row-${ANVIL_SAFE_THREE_SIGNERS}"]`,
  );
  await safeRow.waitFor({ state: "visible" });
  const collapseCheckbox = safeRow.locator(
    '[data-testid="safe-account-collapse"]',
  );
  await collapseCheckbox.waitFor({ state: "visible" });
  await collapseCheckbox.click();
  const safeRowLink = safeRow.locator(
    `[data-testid="safe-account-link-${ANVIL_SAFE_THREE_SIGNERS}-${CHAIN_ID_ANVIL}"]`,
  );
  await safeRowLink.waitFor({ state: "visible" });
  await safeRowLink.click();

  // Wait for dashboard to load
  await expect(
    page.locator('[data-testid="safe-dashboard-threshold"]'),
  ).toBeVisible();

  // Export transaction
  const exportBtn = page.getByTestId("safe-dashboard-export-tx-btn");
  await exportBtn.waitFor({ state: "visible" });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    exportBtn.click(),
  ]);
  const exportPath = await download.path();
  expect(exportPath).toBeTruthy();

  // Read the downloaded file
  const fileContent = fs.readFileSync(exportPath, "utf-8");
  const exportedTx = JSON.parse(fileContent);

  // Assert exported transaction structure and values
  expect(exportedTx).toHaveProperty("tx");
  expect(exportedTx.tx.data.to).toBe(
    MOCK_SAFE_TX_SIGNED_MAP[ANVIL_SAFE_THREE_SIGNERS].data.to,
  );
  expect(exportedTx.tx.signatures[0].signer).toBe(
    MOCK_SAFE_TX_SIGNED_MAP[ANVIL_SAFE_THREE_SIGNERS].signatures[0].signer,
  );
});

test("should import Safe transaction JSON and show in dashboard", async ({
  page,
}) => {
  // Seed localStorage with empty SafeTx map before page load
  await page.addInitScript(() => {
    localStorage.setItem("MSIGUI_safeCurrentTxMap", JSON.stringify({}));
  });

  // Reload the page to ensure the script runs and reconnect wallet if needed
  await page.reload();
  if (
    await page.locator('[data-testid="rk-connect-button"]').first().isVisible()
  ) {
    await page.locator('[data-testid="rk-connect-button"]').first().click();
    await page.waitForSelector('[data-testid="rk-wallet-option-metaMask"]', {
      timeout: 60000,
    });
    await page.locator('[data-testid="rk-wallet-option-metaMask"]').click();
  }

  // Click the Safe row link for the correct chain/address
  const safeRow = page.locator(
    `[data-testid="safe-account-row-${ANVIL_SAFE_THREE_SIGNERS}"]`,
  );
  await safeRow.waitFor({ state: "visible" });
  const collapseCheckbox = safeRow.locator(
    '[data-testid="safe-account-collapse"]',
  );
  await collapseCheckbox.waitFor({ state: "visible" });
  await collapseCheckbox.click();
  const safeRowLink = safeRow.locator(
    `[data-testid="safe-account-link-${ANVIL_SAFE_THREE_SIGNERS}-${CHAIN_ID_ANVIL}"]`,
  );
  await safeRowLink.waitFor({ state: "visible" });
  await safeRowLink.click();

  // Wait for dashboard to load
  await expect(
    page.locator('[data-testid="safe-dashboard-threshold"]'),
  ).toBeVisible();

  // Prepare a mock transaction file for import
  const importFilePath = `/tmp/mock_safe_tx_import.json`;
  fs.writeFileSync(
    importFilePath,
    JSON.stringify({
      tx: MOCK_SAFE_TX_SIGNED_MAP[ANVIL_SAFE_THREE_SIGNERS],
    }),
  );

  // Import transaction
  const importBtn = page.getByTestId("safe-dashboard-import-tx-btn");
  await importBtn.waitFor({ state: "visible" });
  const importInput = page.locator(
    '[data-testid="safe-dashboard-import-tx-input"]',
  );
  await importInput.setInputFiles(importFilePath);

  // Wait for import modal to appear and confirm
  const importModal = page.locator(
    '[data-testid="safe-dashboard-import-tx-modal-root"]',
  );
  await importModal.waitFor({ state: "visible" });
  const replaceBtn = importModal.locator(
    '[data-testid="safe-dashboard-import-tx-modal-replace-btn"]',
  );
  await replaceBtn.click();
  await importModal.waitFor({ state: "hidden" });

  // Assert that the transaction is now present in the dashboard
  await expect(
    page.locator('[data-testid="safe-dashboard-current-tx-card"]'),
  ).toBeVisible();

  // Verify imported transaction data in localStorage
  const importedTxMap = await page.evaluate(() => {
    const raw = localStorage.getItem("MSIGUI_safeCurrentTxMap");
    return JSON.parse(raw ?? "{}");
  });
  expect(importedTxMap[ANVIL_SAFE_THREE_SIGNERS].data.to).toBe(
    MOCK_SAFE_TX_SIGNED_MAP[ANVIL_SAFE_THREE_SIGNERS].data.to,
  );
  expect(importedTxMap[ANVIL_SAFE_THREE_SIGNERS].signatures[0].signer).toBe(
    MOCK_SAFE_TX_SIGNED_MAP[ANVIL_SAFE_THREE_SIGNERS].signatures[0].signer,
  );
});
