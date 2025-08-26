# MSIG UI

A web interface for managing multisignature wallets inspired by SafeWallet and [EternalSafeWallet](https://github.com/eternalsafe/wallet).

## Project Objective

Create a 100% local safe wallet.

## Proposed Workflow

1. Users can either self-host the website or use a hosted version
2. They connect using metamask/walletconnect/etc
3. They can connect to other websites to sign transactions/messages
4. When signing a message, users receive either a link or file to share with friends for their signatures

## Key Differentiators

This differs from the Safe{Wallet} UI, which stores partially signed transactions on a centralized server.
The website should also allow users to import safe wallets across multiple networks.

## Tech Stack

- nextjs, similar to what we teach in the full stack curriculum

---

## Developer checklist

TODO

---

## References

[SafeSDK: Protocol Kit](https://docs.safe.global/sdk/protocol-kit)
