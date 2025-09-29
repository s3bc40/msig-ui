import { ANVIL_SAFE_THREE_SIGNERS } from "./utils/constants";
import { test } from "./utils/fixture";

const { expect } = test;

test("should connect (add) existing Safe accounts from Anvil state using ConnectSafeClient", async ({
  page,
  metamask,
}) => {
  // Connect wallet if not already connected
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

  // Click continue button to go past account selection
  const continueBtn = await page.locator(
    '[data-testid="continue-with-account"]',
  );
  if (await continueBtn.isVisible()) {
    await continueBtn.click();
  }

  // Click on Add Safe btn
  await page.waitForSelector('[data-testid="add-safe-nav-btn"]', {
    timeout: 60000,
  });
  await page.locator('[data-testid="add-safe-nav-btn"]').click();

  // Add first Safe (anvil, 3 owners)
  await page.waitForSelector('[data-testid="safe-name-input"]', {
    timeout: 60000,
  });
  await page.locator('[data-testid="safe-name-input"]').fill("Anvil 3 Owners");
  await page
    .locator('[data-testid="safe-address-input"]')
    .fill(ANVIL_SAFE_THREE_SIGNERS);
  await page
    .locator('[data-testid="network-select"]')
    .selectOption({ label: "Anvil" });
  await page.locator('[data-testid="add-safe-btn"]').click();

  // Wait for navigation to /accounts and check table
  await page.waitForURL("/accounts");
  await expect(
    page.locator('[data-testid="safe-accounts-table"]'),
  ).toBeVisible();
  const safeRow = page.locator(
    `[data-testid="safe-account-row-${ANVIL_SAFE_THREE_SIGNERS}"]`,
  );
  await expect(safeRow).toContainText("Anvil 3 Owners");
  await expect(safeRow).toContainText(ANVIL_SAFE_THREE_SIGNERS);
});
