import Link from "next/link";

export default function AccountsPage() {
  return (
    <div className="container mx-auto max-w-2xl self-center shadow-2xl">
      <div className="bg-base-100 flex flex-col items-center justify-center gap-8 p-10">
        <h2 className="mb-4 text-4xl font-bold">Choose an Action</h2>
        <p className="mb-8 text-center text-xl">
          Create a new Safe account or connect to an existing one to manage your
          multi-signature wallet.
        </p>
        <div className="flex w-full flex-col gap-6">
          <Link
            href="/new-safe/create"
            className="btn btn-primary btn-soft w-full rounded py-4 text-lg"
          >
            Create Safe Account
          </Link>
          <Link
            href="/new-safe/connect"
            className="btn btn-primary btn-soft w-full rounded py-4 text-lg"
          >
            Connect to Safe Account
          </Link>
        </div>
      </div>
    </div>
  );
}
