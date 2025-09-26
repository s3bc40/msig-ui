import { testWithMetaMask as test } from "./fixtures/testWithMetamask";
import fs from "fs";
import { MOCK_SAFEWALLET_DATA } from "./constants";

const { expect } = test;

test("should export SafeWallet data and verify file content", async ({
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

  await page.goto("/accounts"); // This must be the first navigation!

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

  await page.evaluate((data) => {
    localStorage.setItem("MSIGUI_safeWalletData", JSON.stringify(data));
  }, MOCK_SAFEWALLET_DATA);

  // Trigger export and capture download
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-testid="export-wallets-btn"]').click(),
  ]);

  // Read the downloaded file
  const downloadPath = await download.path();
  const fileContent = fs.readFileSync(downloadPath, "utf-8");
  const exportedData = JSON.parse(fileContent);

  // Assert exported data matches mock
  expect(exportedData.version).toBe(MOCK_SAFEWALLET_DATA.version);

  // AddressBook assertions
  expect(
    exportedData.data.addressBook["31337"][
      "0xe80f3c2046c04bf94b04ca142f94fbf7480110c7"
    ],
  ).toBe("Anvil 3 Owners");
  // Only one address in addressBook[31337] in the updated mock
  expect(
    exportedData.data.addressBook["31337"][
      "0xbd84F8EB4fC2054E177C44966E0fe6F4D843a6cF"
    ],
  ).toBeUndefined();

  // UndeployedSafes assertions
  expect(exportedData.data.undeployedSafes["31337"].props.factoryAddress).toBe(
    MOCK_SAFEWALLET_DATA.data.undeployedSafes["31337"].props.factoryAddress,
  );
  expect(exportedData.data.undeployedSafes["31337"].status.status).toBe(
    "AWAITING_EXECUTION",
  );
  expect(
    exportedData.data.undeployedSafes["11155111"].props.factoryAddress,
  ).toBe(
    MOCK_SAFEWALLET_DATA.data.undeployedSafes["11155111"].props.factoryAddress,
  );
  expect(exportedData.data.undeployedSafes["11155111"].status.status).toBe(
    "AWAITING_EXECUTION",
  );
});

test("should import SafeWallet data and restore accounts", async ({
  page,
  metamask,
}) => {
  // Seed localStorage with empty data before page load
  await page.addInitScript(() => {
    localStorage.setItem(
      "MSIGUI_safeWalletData",
      JSON.stringify({
        version: "3.0",
        data: {
          addressBook: {},
          addedSafes: {},
          undeployedSafes: {},
          visitedSafes: {},
        },
      }),
    );
  });

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

  // Prepare a mock file for import
  const importFilePath = `/tmp/mock_safe_wallet_import.json`;
  fs.writeFileSync(importFilePath, JSON.stringify(MOCK_SAFEWALLET_DATA));

  // Simulate file upload for import
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator('[data-testid="import-wallets-btn"]').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(importFilePath);

  // Wait for the import modal to appear and Replace button to be enabled
  await page.waitForSelector('[data-testid="import-modal"]', {
    state: "visible",
  });
  const replaceBtn = page.locator('[data-testid="replace-wallets-btn"]');
  await replaceBtn.waitFor({ state: "visible" });
  await expect(replaceBtn).toBeEnabled();
  await replaceBtn.click();
  // Wait for modal to close
  await page.waitForSelector('[data-testid="import-modal"]', {
    state: "hidden",
  });

  // Verify imported data is present in localStorage
  const importedData = await page.evaluate(() => {
    const raw = localStorage.getItem("MSIGUI_safeWalletData");
    return JSON.parse(raw ?? "{}");
  });

  expect(importedData.version).toBe(MOCK_SAFEWALLET_DATA.version);
  console.log("Exported Data:", importedData.data);
  expect(
    importedData.data.addressBook["31337"][
      "0xe80f3c2046c04bf94b04ca142f94fbf7480110c7"
    ],
  ).toBe("Anvil 3 Owners");
  expect(importedData.data.undeployedSafes["31337"].props.factoryAddress).toBe(
    MOCK_SAFEWALLET_DATA.data.undeployedSafes["31337"].props.factoryAddress,
  );
  expect(importedData.data.undeployedSafes["31337"].status.status).toBe(
    "AWAITING_EXECUTION",
  );
});
