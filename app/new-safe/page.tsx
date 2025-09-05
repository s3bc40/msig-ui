import Link from "next/link";
import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";

export default function NewSafePage() {
  return (
    <AppSection className="max-w-2xl self-center">
      <AppCard>
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
      </AppCard>
    </AppSection>
  );
}
