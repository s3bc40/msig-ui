import ConnectSafeClient from "./ConnectSafeClient";

/**
 * Connect Safe Page Component
 *
 * This component serves as the main entry point for the Connect Safe page.
 * It imports and renders the ConnectSafeClient component, which contains
 * the client-side logic and UI for connecting an existing safe.
 *
 * @returns The Connect Safe page component.
 */
export default function Page() {
  return <ConnectSafeClient />;
}
