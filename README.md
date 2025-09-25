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

## Core Architectural Decisions

1. **Next.js App Router: Hybrid Rendering**
   - **Server Components** will handle non-interactive, read-only data fetching and UI rendering. This is crucial for performance and security, as it minimizes the JavaScript bundle sent to the client and keeps sensitive information (like private RPC URLs) on the server.
   - **Client Components** will be used exclusively for interactive elements that require state, event handlers (e.g., `onClick`), or browser-only APIs (`window.ethereum`). All wallet-related hooks (`wagmi`, `RainbowKit`) and form handling will reside here.
2. **The Technology Stack:**
   - **`wagmi`**: Provides a high-level, declarative React hooks API for general Web3 interactions, abstracting complex state management and offering an excellent developer experience.
   - **`viem`**: A low-level, type-safe interface for direct blockchain operations. It is the foundational library that `wagmi` is built upon and is also a core dependency of the `SafeSDK Protocol kit`. This ensures seamless compatibility.
   - **`SafeSDK Protocol kit`**: The specialized business logic layer for all Safe-related operations. It is essential for creating, signing, and executing complex multi-signature transactions and for fetching Safe-specific information like owners and threshold. The kit is fully compatible with `viem` and `wagmi`, as they serve complementary roles.
   - **`RainbowKit`**: A library for providing a pre-built, intuitive UI for wallet connections, which simplifies the user experience.
3. **Data Fetching and State Management (`TanStack Query`)**
   - **Server-Side Pre-fetching:** To avoid slow initial load times and "flashes of empty data," the application will pre-fetch data from the blockchain on the server using `wagmi`'s core functions and the `SafeSDK Protocol kit`'s methods.
   - **Client-Side Hydration:** The pre-fetched data will then be "hydrated" into the `TanStack Query` cache on the client. This allows `wagmi` hooks (e.g., `useBalance`) to read from the cache and display the data immediately.
   - **Automatic Cache Invalidation:** When a user performs a mutation (e.g., sending a transaction), the `wagmi` hook will automatically invalidate the relevant queries in the cache. This triggers a background refetch, ensuring the UI is updated with the latest on-chain state without a full page refresh. This is a key part of the planned responsive user experience.

## Hypothetical Project Tree

```bash
    /my-safe-wallet
    ├──.next/
    ├── node_modules/
    ├── public/
    │   └── icons/
    │
    ├── app/
    │   ├── layout.tsx (Server Component)
    │   ├── page.tsx (Server Component)
    │   ├── providers.tsx (Client Component, "use client")
    │   │
    │   ├── create-transaction/
    │   │   ├── page.tsx (Server Component)
    │   │   └── CreateTransactionForm.tsx (Client Component)
    │   │
    │   ├── sign-transaction/
    │   │   ├── page.tsx (Server Component)
    │   │   └── SignTransaction.tsx (Client Component)
    │   │
    │   └── components/
    │       ├── ui/
    │       │   ├── Button.tsx
    │       │   └── Form.tsx
    │       │
    │       └── wallet/
    │           ├── ConnectButton.tsx (Client Component)
    │           └── BalanceDisplay.tsx (Client Component)
    │
    ├── lib/
    │   ├── viem-client.ts
    │   └── safe-data.ts
    │
    ├── hooks/
    │   └── useSafeData.ts
    │
    ├──.gitignore
    ├── next.config.js
    ├── package.json
    └── tsconfig.json
```

### The `app/` Directory

This is the heart of your application, leveraging Next.js's App Router to define your routes and component rendering strategy.

- `app/layout.tsx` (Server Component): This is your top-level layout. It is a Server Component, meaning it runs on the server and is perfect for tasks like setting up the `wagmi` configuration for server-side rendering and orchestrating the initial state hydration. It will wrap your application with the
  `HydrationBoundary` to pass pre-fetched data from the server to the client.
- `app/providers.tsx` (Client Component): This file, marked with `"use client"`, contains all the client-side providers. It will wrap your application with `WagmiProvider` and `QueryClientProvider`, which are essential for managing wallet state and the `TanStack Query` cache. It will receive the initial state from `layout.tsx` to ensure a seamless transition from server to client.
- `app/page.tsx` (Server Component): This is the main page of your application. It will be an `async` Server Component, allowing you to `await` data fetches before rendering. This is where you would call your server-side functions from the `lib/` directory to get information about a user's Safe before the page is delivered to the browser.
- `app/[feature]/page.tsx` (Server Components): Each feature folder (e.g., `create-transaction`, `sign-transaction`) will have a Server Component `page.tsx` that handles any data fetching for that route. This ensures the page is as fast as possible on the initial load.
- `app/[feature]/[FeatureComponent].tsx` (Client Components): The components within these feature folders that require interactivity (e.g., forms, buttons) will be Client Components. This is where you will use your `wagmi` hooks to handle user input, send transactions, and manage local state.
- `app/components/`: A general-purpose directory for reusable UI components, split into `ui/` for generic elements and `wallet/` for Web3-specific ones like the `ConnectButton`, which must be a Client Component as it relies on browser-only APIs.

### The `lib/` Directory

This is where your secure, server-side code lives. The functions here are backend-agnostic and will not contain any React-specific code.

- `viem-client.ts`: Your `viem` client setup, which will be imported into other server-side files.
- `safe-data.ts`: This file will contain functions that use the `SafeSDK Protocol kit` and `viem` to fetch data from the blockchain. Functions like
  `getSafeOwners()` and `getSafeThreshold()` are perfect candidates for this, as their data is relatively static and can be fetched on the server before the page loads.

### The `hooks/` Directory

This directory will contain any custom React hooks you create to simplify data retrieval on the client side.

- `useSafeData.ts`: This file would contain custom hooks like `useSafeOwners()` or `useSafeThreshold()` that are simply a wrapper around `TanStack Query`'s `useQuery` hook. They provide a clean, declarative way for your Client Components to access the data that was pre-fetched on the server.

---

## Developer checklist

- [ ] Build create safe account flow (Protocol Kit)
- [ ] Build connect safe account flow (Protocol Kit)
- [ ] Build create transaction flow

---

## Deploying Safe Contracts Locally with `safe-smart-account`

To run your own local Safe contracts for development, follow these steps:

1. **Clone the Repository**

   ```sh
   git clone https://github.com/safe-global/safe-smart-account.git
   cd safe-smart-account
   ```

2. **Checkout the Correct Version**
   - Switch to the tag for version 1.4.1 contracts:
     ```sh
     git checkout tags/v1.4.1-3
     ```

3. **Install Dependencies and Build**

   ```sh
   npm install
   npm run build
   ```

4. **Start a Local Anvil Node**
   - You can use Foundry’s Anvil or Hardhat’s local node. For Anvil:
     ```sh
     anvil
     ```
   - (Or start your preferred local Ethereum node.)

5. **Create a `.env` File**
   - In the root of the `safe-smart-account` repo, create a `.env` file with the following contents:
     ```ini
     MNEMONIC="test test test test test test test test test test test junk"
     NODE_URL="http://127.0.0.1:8545"
     ```

6. **Deploy Contracts**
   - In a separate terminal, run:
     ```sh
     npx hardhat --network custom deploy
     ```
   - This will deploy all Safe contracts to your local network.

7. **Update Contract Addresses**
   - After deployment, copy the contract addresses from the output and update them in your project’s `localContractNetworks.ts` file.

> **Note:**
> Currently, contract addresses are manually maintained in `localContractNetworks.ts`. In the future, we may automate this process or use environment variables for better flexibility.

`pkill -9 ^next-server` # To stop any running Next.js server instances.
`pnpm exec playwright test` # To run end-to-end tests.

---

## References

[SafeSDK: Protocol Kit](https://docs.safe.global/sdk/protocol-kit)
