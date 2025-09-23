import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "@/test/wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

test("should connect wallet to the MetaMask Test Dapp", async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  const metamask = new MetaMask(
    context,
    metamaskPage,
    basicSetup.walletPassword,
    extensionId,
  );

  await page.goto("/");

  // Wait for RainbowKit connect button and click
  await page.waitForSelector('[data-testid="rk-connect-button"]', {
    timeout: 10000,
  });
  await page.locator('[data-testid="rk-connect-button"]').first().click();

  // Wait for MetaMask option in modal and click
  await page.waitForSelector('[data-testid="rk-wallet-option-metaMask"]', {
    timeout: 10000,
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
