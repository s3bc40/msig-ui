"use client";

import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";

export default function TxSignPage() {
  // TODO: Integrate with transaction sharing and signing logic
  // For now, placeholder UI
  return (
    <AppSection>
      <AppCard title="Sign Safe Transaction">
        <div className="flex flex-col gap-4">
          <p>
            Import a transaction JSON, review details, and sign as an owner.
          </p>
          {/* TODO: Add import/export, signature status, sign button */}
        </div>
      </AppCard>
    </AppSection>
  );
}
