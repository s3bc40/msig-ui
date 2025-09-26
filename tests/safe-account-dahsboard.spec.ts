import { testWithMetaMask as test } from "./fixtures/testWithMetamask";
import {
  ANVIL_SAFE_THREE_SIGNERS,
  CHAIN_ID_ANVIL,
  MOCK_SAFEWALLET_DATA,
} from "./constants";

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
});

// Transaction workflow test for Safe page
test("should redirect to safe dashboard on click on account row", async ({
  page,
}) => {
  // Expand the safe account row if needed
  const safeRow = page.locator(
    `[data-testid="safe-account-row-${ANVIL_SAFE_THREE_SIGNERS}"]`,
  );
  await safeRow.waitFor({ state: "visible" });
  const collapseCheckbox = safeRow.locator(
    '[data-testid="safe-account-collapse"]',
  );
  await collapseCheckbox.waitFor({ state: "visible" });
  await collapseCheckbox.click();
  // Now click the safe link for the correct chain/address
  const safeRowLink = safeRow.locator(
    `[data-testid="safe-account-link-${ANVIL_SAFE_THREE_SIGNERS}-${CHAIN_ID_ANVIL}"]`,
  );
  await safeRowLink.waitFor({ state: "visible" });
  await safeRowLink.click();

  // Assert SafeDashboardClient key elements are visible
  await expect(
    page.locator('[data-testid="safe-dashboard-threshold"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="safe-dashboard-owners"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="safe-dashboard-nonce"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="safe-dashboard-balance"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="safe-dashboard-divider"]'),
  ).toBeVisible();
});
