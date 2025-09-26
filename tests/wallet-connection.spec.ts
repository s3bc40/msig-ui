import { testWithMetaMask as test } from "./fixtures/testWithMetamask";

const { expect } = test;

test("should connect wallet to the app via RainbowKit and MetaMask", async ({
  page,
  metamask,
}) => {
  await page.goto("/");

  // Wait for RainbowKit connect button and click
  await page.waitForSelector('[data-testid="rk-connect-button"]', {
    timeout: 60000,
  });
  await page.locator('[data-testid="rk-connect-button"]').first().click();

  // Wait for MetaMask option in modal and click
  await page.waitForSelector('[data-testid="rk-wallet-option-metaMask"]', {
    timeout: 60000,
  });
  await page.locator('[data-testid="rk-wallet-option-metaMask"]').click();

  // Connect MetaMask to dapp
  await metamask.connectToDapp();

  // Verify Navbar shows connected account
  await expect(page.locator('[data-testid="rk-account-button"]')).toBeVisible();
  await expect(page.locator('[data-testid="rk-account-button"]')).toContainText(
    "0x",
  );

  // Verify Continue button shows connected account
  await expect(
    page.locator('[data-testid="continue-with-account"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="continue-with-account"]'),
  ).toContainText("Continue with 0x");
});
