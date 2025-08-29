import Link from "next/link";

export default function SideBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="drawer md:drawer-open border-base-300 border-x">
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        {/* Main content */}
        {children}
      </div>
      <div className="drawer-side border-base-300 top-16 border-r">
        <label
          htmlFor="sidebar-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-base-100 text-base-content min-h-full w-64 p-4">
          <li>
            <Link href="/">Home</Link>
          </li>
          {/* Add more sidebar links here */}
        </ul>
      </div>
    </div>
  );
}
