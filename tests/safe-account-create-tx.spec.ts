import { testWithMetaMask as test } from "./fixtures/testWithMetamask";
import { MOCK_SAFEWALLET_DATA } from "./constants";

const { expect } = test;

// Transaction workflow test for Safe page
test("should create and execute a transaction from Safe dashboard", async ({
  page,
  metamask,
}) => {
  // Seed localStorage before page load
  await page.addInitScript(
    ({ data }) => {
      localStorage.setItem("MSIGUI_safeWalletData", JSON.stringify(data));
    },
    { data: MOCK_SAFEWALLET_DATA },
  );

  // Go to accounts page and click the Safe row link for the correct chain/address
  await page.goto("/accounts");
  const safeAddress = "0xe80f3c2046c04bf94b04ca142f94fbf7480110c7";
  const chainId = "31337";
  // Expand the safe account row if needed
  const safeRow = page.locator(
    `[data-testid="safe-account-row-${safeAddress}"]`,
  );
  await safeRow.waitFor({ state: "visible" });
  const collapseCheckbox = safeRow.locator(
    '[data-testid="safe-account-collapse"]',
  );
  await collapseCheckbox.waitFor({ state: "visible" });
  await collapseCheckbox.click();
  // Now click the safe link for the correct chain/address
  const safeRowLink = safeRow.locator(
    `[data-testid="safe-account-link-${safeAddress}-${chainId}"]`,
  );
  await safeRowLink.waitFor({ state: "visible" });
  await safeRowLink.click();

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

  // Go to builder
  await page
    .locator('[data-testid="safe-dashboard-go-to-builder-btn"]')
    .click();

  // Fill transaction details (example: send ETH)
  await page
    .locator('[data-testid="new-safe-tx-recipient-input"]')
    .fill("0x44586c5784a07Cc85ae9f33FCf6275Ea41636A87");
  await page.locator('[data-testid="new-safe-tx-value-input"]').fill("10"); // in finney (0.01 ETH)
  const addTxBtn = page.locator('[data-testid="new-safe-tx-add-btn"]');

  await expect(addTxBtn).toBeEnabled();
  await addTxBtn.click();

  // Wait for transaction to appear in the list
  await expect(
    page.locator('[data-testid="new-safe-tx-list-row-0"]'),
  ).toBeVisible();

  // Build Safe Transaction
  const buildBtn = page.locator('[data-testid="new-safe-tx-build-btn"]');
  await expect(buildBtn).toBeEnabled();
  await buildBtn.click();

  // Wait for redirect to tx details page and check details
  await page.waitForSelector('[data-testid="tx-details-section"]', {
    state: "visible",
  });
  await expect(page.locator('[data-testid="tx-details-to-value"]')).toHaveText(
    "0x44586c5784a07Cc85ae9f33FCf6275Ea41636A87",
  );
  await expect(
    page.locator('[data-testid="tx-details-value-value"]'),
  ).toHaveText("10"); // in wei
});

test("should create transactions with all input variations in builder", async ({
  page,
  metamask,
}) => {
  // Seed localStorage before page load
  await page.addInitScript(
    ({ data }) => {
      localStorage.setItem("MSIGUI_safeWalletData", JSON.stringify(data));
    },
    { data: MOCK_SAFEWALLET_DATA },
  );

  // Go to accounts page and click the Safe row link for the correct chain/address
  await page.goto("/accounts");
  const safeAddress = "0xe80f3c2046c04bf94b04ca142f94fbf7480110c7";
  const chainId = "31337";
  // Expand the safe account row if needed
  const safeRow = page.locator(
    `[data-testid="safe-account-row-${safeAddress}"]`,
  );
  await safeRow.waitFor({ state: "visible" });
  const collapseCheckbox = safeRow.locator(
    '[data-testid="safe-account-collapse"]',
  );
  await collapseCheckbox.waitFor({ state: "visible" });
  await collapseCheckbox.click();
  // Now click the safe link for the correct chain/address
  const safeRowLink = safeRow.locator(
    `[data-testid="safe-account-link-${safeAddress}-${chainId}"]`,
  );
  await safeRowLink.waitFor({ state: "visible" });
  await safeRowLink.click();

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

  // Go to builder
  await page
    .locator('[data-testid="safe-dashboard-go-to-builder-btn"]')
    .click();

  // 1. Basic ETH transfer
  await page
    .locator('[data-testid="new-safe-tx-recipient-input"]')
    .fill("0x1111111111111111111111111111111111111111");
  await page.locator('[data-testid="new-safe-tx-value-input"]').fill("0.5");
  const addTxBtn = page.locator('[data-testid="new-safe-tx-add-btn"]');
  await expect(addTxBtn).toBeEnabled();
  await addTxBtn.click();
  await expect(
    page.locator('[data-testid="new-safe-tx-list-row-0"]'),
  ).toBeVisible();

  // 2. With Data Hex
  await page
    .locator('[data-testid="new-safe-tx-recipient-input"]')
    .fill("0x2222222222222222222222222222222222222222");
  await page.locator('[data-testid="new-safe-tx-value-input"]').fill("1");
  await page.locator('[data-testid="new-safe-tx-data-toggle"]').click();
  await page
    .locator('[data-testid="new-safe-tx-data-input"]')
    .fill("0xdeadbeef");
  await expect(addTxBtn).toBeEnabled();
  await addTxBtn.click();
  await expect(
    page.locator('[data-testid="new-safe-tx-list-row-1"]'),
  ).toBeVisible();

  // 3. With ABI method
  const abiJson = JSON.stringify([
    {
      type: "function",
      name: "transfer",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
    },
  ]);
  await page.locator('[data-testid="new-safe-tx-abi-input"]').fill(abiJson);
  await page
    .locator('[data-testid="new-safe-tx-abi-methods-select"]')
    .selectOption("transfer");
  await page
    .locator('[data-testid="new-safe-tx-abi-method-input-to"]')
    .fill("0x3333333333333333333333333333333333333333");
  await page
    .locator('[data-testid="new-safe-tx-abi-method-input-amount"]')
    .fill("12345");
  await page
    .locator('[data-testid="new-safe-tx-recipient-input"]')
    .fill("0x3333333333333333333333333333333333333333");
  await page.locator('[data-testid="new-safe-tx-value-input"]').fill("2");
  await expect(addTxBtn).toBeEnabled();
  await addTxBtn.click();
  await expect(
    page.locator('[data-testid="new-safe-tx-list-row-2"]'),
  ).toBeVisible();

  // 4. With method but no inputs
  const abiJsonNoInputs = JSON.stringify([
    {
      type: "function",
      name: "ping",
      inputs: [],
    },
  ]);
  await page
    .locator('[data-testid="new-safe-tx-abi-input"]')
    .fill(abiJsonNoInputs);
  await page
    .locator('[data-testid="new-safe-tx-abi-methods-select"]')
    .selectOption("ping");
  await page
    .locator('[data-testid="new-safe-tx-recipient-input"]')
    .fill("0x4444444444444444444444444444444444444444");
  await page.locator('[data-testid="new-safe-tx-value-input"]').fill("3");
  await expect(addTxBtn).toBeEnabled();
  await addTxBtn.click();
  await expect(
    page.locator('[data-testid="new-safe-tx-list-row-3"]'),
  ).toBeVisible();

  // Check all rows are present
  for (let i = 0; i < 4; i++) {
    await expect(
      page.locator(`[data-testid="new-safe-tx-list-row-${i}"]`),
    ).toBeVisible();
  }
});
