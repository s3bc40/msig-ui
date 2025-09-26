import { testWithMetaMask as test } from "./fixtures/testWithMetamask";

const { expect } = test;

test("should create a new safe account and navigate to dashboard", async ({
  page,
  metamask,
}) => {
  await page.goto("/");

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

  // Check we are on accounts page
  await page.waitForURL("/accounts");
  await expect(page).toHaveURL(/\/accounts$/);

  // Click navigation button to go to safe creation page
  await page.waitForSelector('[data-testid="create-safe-nav-btn"]', {
    timeout: 60000,
  });
  await page.locator('[data-testid="create-safe-nav-btn"]').click();

  // Step 1: Fill in safe name and select network (StepNameAndNetworks)
  await page.waitForSelector('[data-testid="safe-name-input"]', {
    timeout: 60000,
  });
  await page.locator('[data-testid="safe-name-input"]').fill("Test Safe");
  // Select Anvil network badge button if available, otherwise select first
  const anvilBtn = await page.locator(
    'input[data-testid^="network-badge-btn-"][aria-label*="anvil" i]',
  );
  if ((await anvilBtn.count()) > 0) {
    await anvilBtn.first().click();
  } else {
    const networkBtn = await page
      .locator('input[data-testid^="network-badge-btn-"]')
      .first();
    await networkBtn.click();
  }
  // Click Next to go to signers step
  await page.locator('button.btn-primary:has-text("Next")').click();

  // Step 2: Add signer (StepSigners)
  // Fill first owner input
  await page.waitForSelector('[data-testid="signer-input-0"]', {
    timeout: 60000,
  });
  await page
    .locator('[data-testid="signer-input-0"]')
    .fill("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  // Optionally add another owner
  // await page.locator('[data-testid="add-owner-btn"]').click();
  // Set threshold (if needed)
  await page.locator('[data-testid="threshold-input"]').fill("1");
  // Click Next to go to review step
  await page.locator('button.btn-primary:has-text("Next")').click();

  // Step 3: Review & create
  const details = page.locator('[data-testid="safe-details-root"]');
  await expect(details.locator('[data-testid="safe-details-name"]')).toHaveText(
    "Test Safe",
  );
  await expect(
    details.locator('[data-testid="safe-details-networks"]'),
  ).not.toContainText("None selected");
  await expect(
    details.locator('[data-testid="safe-details-signers"]'),
  ).toBeVisible();
  await expect(
    details.locator('[data-testid="safe-details-signer-0"]'),
  ).toContainText("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  await expect(
    details.locator('[data-testid="safe-details-threshold-value"]'),
  ).toContainText("1 / 1");

  // Wait for prediction to finish and assert predicted address
  await page.waitForSelector('[data-testid="predicted-safe-address-value"]', {
    timeout: 15000,
  });
  await expect(
    page.locator('[data-testid="predicted-safe-address-value"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="predicted-safe-address-value"]'),
  ).not.toHaveText("0x");

  // Click Create Safe
  await page.locator('[data-testid="create-safe-btn"]').click();

  // Wait for deployment modal and assert modal content
  await page.waitForSelector('[data-testid="deployment-modal-root"]', {
    timeout: 20000,
  });
  const modal = page.locator('[data-testid="deployment-modal-root"]');
  await expect(
    modal.locator('[data-testid="deployment-modal-title"]'),
  ).toHaveText("Workflow Progress");
  await expect(
    modal.locator('[data-testid="deployment-modal-steps-list"]'),
  ).toBeVisible();

  // Confirm metamask popup and confirm transaction
  await page.waitForSelector(
    '[data-testid="deployment-modal-step-loading-txSent"]',
    {
      timeout: 60000,
    },
  );
  await metamask.confirmTransactionAndWaitForMining();
  // const stepLoadingTxSent = page.locator(
  //   '[data-testid="deployment-modal-step-loading-txSent"]',
  // );
  // await stepLoadingTxSent.waitFor({ state: "hidden", timeout: 60000 });

  // Check that step is marked as success
  const stepConfirmed = page.locator(
    '[data-testid="deployment-modal-step-confirmed"]',
  );
  await expect(stepConfirmed).toHaveClass(/step-success/);

  // Check that txHash is visible and not N/A
  const txHashLocator = modal.locator(
    '[data-testid="deployment-modal-txhash"]',
  );
  await expect(txHashLocator).toBeVisible();
  await expect(txHashLocator).not.toHaveText("N/A");
  // Wait for success button to appear and click it
  await page.waitForSelector('[data-testid="deployment-modal-success-btn"]', {
    timeout: 60000,
  });
  await page.locator('[data-testid="deployment-modal-success-btn"]').click();

  // Assert navigation to dashboard and safe appears
  await page.waitForURL("/accounts");
  await expect(
    page.locator('[data-testid="safe-accounts-table"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="safe-accounts-table"]'),
  ).toContainText("Test Safe");
  // Optionally check that the new safe row exists
  await expect(
    page.locator('[data-testid^="safe-account-row-"]'),
  ).toContainText("Test Safe");
});

test("should create a new safe account on Sepolia and Anvil and show undeployed row", async ({
  page,
  metamask,
}) => {
  await page.goto("/");

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

  // Check we are on accounts page
  await page.waitForURL("/accounts");
  await expect(page).toHaveURL(/\/accounts$/);

  // Click navigation button to go to safe creation page
  await page.waitForSelector('[data-testid="create-safe-nav-btn"]', {
    timeout: 60000,
  });
  await page.locator('[data-testid="create-safe-nav-btn"]').click();

  // Step 1: Fill in safe name and select Sepolia + Anvil networks
  await page.waitForSelector('[data-testid="safe-name-input"]', {
    timeout: 60000,
  });
  await page.locator('[data-testid="safe-name-input"]').fill("MultiNet Safe");

  // Select Sepolia network badge button
  const sepoliaBtn = await page.locator(
    'input[data-testid^="network-badge-btn-"][aria-label*="sepolia" i]',
  );
  if ((await sepoliaBtn.count()) > 0) {
    await sepoliaBtn.first().click();
  }
  // Select Anvil network badge button
  const anvilBtn = await page.locator(
    'input[data-testid^="network-badge-btn-"][aria-label*="anvil" i]',
  );
  if ((await anvilBtn.count()) > 0) {
    await anvilBtn.first().click();
  }

  // Click Next to go to signers step
  await page.locator('button.btn-primary:has-text("Next")').click();

  // Step 2: Add signer (StepSigners)
  await page.waitForSelector('[data-testid="signer-input-0"]', {
    timeout: 60000,
  });
  await page
    .locator('[data-testid="signer-input-0"]')
    .fill("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  // Optionally add another owner
  // await page.locator('[data-testid="add-owner-btn"]').click();
  // Set threshold (if needed)
  await page.locator('[data-testid="threshold-input"]').fill("1");
  // Click Next to go to review step
  await page.locator('button.btn-primary:has-text("Next")').click();

  // Step 3: Review & create
  const details = page.locator('[data-testid="safe-details-root"]');
  await expect(details.locator('[data-testid="safe-details-name"]')).toHaveText(
    "MultiNet Safe",
  );
  await expect(
    details.locator('[data-testid="safe-details-networks"]'),
  ).toContainText("Sepolia");
  await expect(
    details.locator('[data-testid="safe-details-networks"]'),
  ).toContainText("Anvil");
  await expect(
    details.locator('[data-testid="safe-details-signers"]'),
  ).toBeVisible();
  await expect(
    details.locator('[data-testid="safe-details-signer-0"]'),
  ).toContainText("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  await expect(
    details.locator('[data-testid="safe-details-threshold-value"]'),
  ).toContainText("1 / 1");

  // Wait for prediction to finish and assert predicted address
  await page.waitForSelector('[data-testid="predicted-safe-address-value"]', {
    timeout: 15000,
  });
  await expect(
    page.locator('[data-testid="predicted-safe-address-value"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="predicted-safe-address-value"]'),
  ).not.toHaveText("0x");

  // Click Create Safe
  await page.locator('[data-testid="add-accounts-btn"]').click();

  // Wait to be navigated back to accounts page
  await page.waitForURL("/accounts");
  await expect(
    page.locator('[data-testid="toggle-deployed-undeployed"]'),
  ).toBeVisible();
  // Toggle to show undeployed safes
  await page.locator('[data-testid="toggle-deployed-undeployed"]').click();

  // Assert undeployed safe appears in the list
  await expect(
    page.locator('[data-testid^="safe-account-row-"]'),
  ).toContainText("MultiNet Safe");
});
