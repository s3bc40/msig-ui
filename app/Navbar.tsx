import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <nav className="flex w-full items-center justify-end border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
      <ConnectButton />
    </nav>
  );
}
