import { test, expect } from "@playwright/test";
import { createPublicClient, http } from "viem";

test("should verify Anvil node is running", async () => {
  const client = createPublicClient({
    transport: http("http://localhost:8545"),
  });
  const blockNumber = await client.getBlockNumber();
  expect(blockNumber).toBeDefined();
});
