import Link from "next/link";

export default function AccountsPage() {
  return (
    <div className="grid w-full place-items-center p-10">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
        <div className="card bg-base-100 flex h-full w-full flex-col shadow-xl">
          <div className="card-body flex flex-1 flex-col items-center justify-center text-center">
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
        <div className="card bg-base-100 flex h-full w-full flex-col shadow-xl">
          <div className="card-body flex flex-1 flex-col items-center justify-center text-center">
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
