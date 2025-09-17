"use client";

import AppSection from "@/app/components/AppSection";
import AppCard from "@/app/components/AppCard";

export default function TxBroadcastPage() {
  // TODO: Integrate with transaction execution logic
  // For now, placeholder UI
  return (
    <AppSection>
      <AppCard title="Broadcast Safe Transaction">
        <div className="flex flex-col gap-4">
          <p>
            Import a fully signed transaction JSON and broadcast it on-chain.
          </p>
          {/* TODO: Add import, broadcast button, status display */}
        </div>
      </AppCard>
    </AppSection>
  );
}
