export const ANVIL_SAFE_THREE_SIGNERS =
  "0xe80f3c2046c04bf94b04ca142f94fbf7480110c7";
export const ANVIL_SAFE_MULTI = "0xbd84F8EB4fC2054E177C44966E0fe6F4D843a6cF";
export const CHAIN_ID_ANVIL = 31337;

export const MOCK_SAFEWALLET_DATA = {
  version: "3.0",
  data: {
    addressBook: {
      "31337": {
        "0xe80f3c2046c04bf94b04ca142f94fbf7480110c7": "Anvil 3 Owners",
      },
    },
    addedSafes: {},
    undeployedSafes: {
      "31337": {
        props: {
          factoryAddress: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
          masterCopy: "0x41675C099F32341bf84BFc5382aF534df5C7461a",
          safeAccountConfig: {
            owners: [
              "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
              "0x44586c5784a07Cc85ae9f33FCf6275Ea41636A87",
            ],
            threshold: 1,
            fallbackHandler: "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99",
          },
          saltNonce: "0",
          safeVersion: "1.4.1",
        },
        status: {
          status: "AWAITING_EXECUTION",
          type: "PayLater",
        },
      },
      "11155111": {
        props: {
          factoryAddress: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
          masterCopy: "0x41675C099F32341bf84BFc5382aF534df5C7461a",
          safeAccountConfig: {
            owners: [
              "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
              "0x44586c5784a07Cc85ae9f33FCf6275Ea41636A87",
            ],
            threshold: 1,
            fallbackHandler: "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99",
          },
          saltNonce: "0",
          safeVersion: "1.4.1",
        },
        status: {
          status: "AWAITING_EXECUTION",
          type: "PayLater",
        },
      },
    },
    visitedSafes: {
      "31337": {
        "0xe80f3c2046c04bf94b04ca142f94fbf7480110c7": {
          lastVisited: Date.now(),
        },
      },
    },
  },
};
