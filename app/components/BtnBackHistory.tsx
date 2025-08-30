"use client";

import { useRouter } from "next/navigation";

export default function BtnBackHistory({ label }: { label?: string }) {
  const router = useRouter();
  return (
    <div className="flex self-start">
      <button
        className="btn btn-ghost btn-secondary"
        onClick={() => router.back()}
      >
        ← {label || "Cancel"}
      </button>
    </div>
  );
}
