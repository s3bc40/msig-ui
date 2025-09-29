// Import necessary Synpress modules
import { ANVIL_MM_ACCOUNTS } from "@/tests/utils/constants";
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

  // Predefined Anvil accounts to add
  for (const accountName of ANVIL_MM_ACCOUNTS.slice(1)) {
    await metamask.addNewAccount(accountName);
  }
  // Switch to Account 1 (the first account in the seed phrase)
  await metamask.switchAccount("Account 1");
  // Switch to the Anvil network
  await metamask.switchNetwork("Anvil");
});
