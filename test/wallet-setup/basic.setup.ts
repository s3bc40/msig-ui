// Import necessary Synpress modules
import { defineWalletSetup } from "@synthetixio/synpress";
import { MetaMask } from "@synthetixio/synpress/playwright";

// Define a test seed phrase and password
const SEED_PHRASE =
  "test test test test test test test test test test test junk";
const PASSWORD = "Tester@1234";

// Define the basic wallet setup
export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  // Create a new MetaMask instance
  const metamask = new MetaMask(context, walletPage, PASSWORD);

  // Import the wallet using the seed phrase
  await metamask.importWallet(SEED_PHRASE);

  // Add the Anvil network
  await metamask.addNetwork({
    name: "Anvil",
    rpcUrl: "http://localhost:8545",
    chainId: 31337,
    symbol: "ETH",
  });

  // Add all test accounts from Anvil (first is already imported via seed phrase)
  const anvilAccounts = [
    "Account 2",
    "Account 3",
    "Account 4",
    "Account 5",
    "Account 6",
    "Account 7",
    "Account 8",
    "Account 9",
    "Account 10",
  ];
  for (const accountName of anvilAccounts) {
    await metamask.addNewAccount(accountName);
  }
  // Switch to Account 1 (the first account in the seed phrase)
  await metamask.switchAccount("Account 1");
  // Switch to the Anvil network
  await metamask.switchNetwork("Anvil");
});
