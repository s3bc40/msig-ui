import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="navbar bg-base-200 border-base-100 sticky top-0 z-20 w-full justify-between border-b">
      <div className="flex items-center">
        <div className="flex-none md:hidden">
          <label
            htmlFor="sidebar-drawer"
            aria-label="open sidebar"
            className="btn btn-square btn-ghost"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-6 w-6 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </label>
        </div>
        <Link className="mx-2 px-2 text-xl font-bold" href="/">
          MSIG UI
        </Link>
      </div>
      <div className="flex-none">
        <ConnectButton label="Connect" />
      </div>
    </nav>
  );
}
