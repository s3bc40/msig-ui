import Link from "next/link";

export default function AccountsPage() {
  return (
    <div className="mx-auto flex min-h-full w-full flex-col items-center justify-center gap-6 p-10">
      <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
        <div className="card bg-base-100 h-full w-full flex-1 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-2xl">Create Safe Account</h2>
            <p className="mb-4">
              Set up a new multi-signature wallet with your chosen owners and
              threshold.
            </p>
            <Link className="btn btn-primary rounded" href="/new-safe/create">
              Create Safe Account
            </Link>
          </div>
        </div>
        <div className="card bg-base-100 h-full w-full flex-1 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-2xl">Connect to Safe Account</h2>
            <p className="mb-4">
              Access and manage an existing Safe wallet by connecting to its
              address.
            </p>
            <Link className="btn btn-primary rounded" href="new-safe/connect">
              Connect to Safe Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
