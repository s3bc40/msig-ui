"use client";
import { useTransition } from "react";

export default function LoadingOverlay() {
  // This will be true if a transition is pending (e.g., navigation)
  const isPending = useTransition()[0];

  if (!isPending) return null;

  return (
    <div className="bg-neutral/80 pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <span className="loading loading-bars loading-xl text-accent/100 bg-accent/100"></span>
    </div>
  );
}
