import React from "react";

interface AppAddressProps {
  address: string;
  className?: string;
  testid?: string;
}

export default function AppAddress({
  address,
  className,
  testid,
}: AppAddressProps) {
  return (
    <span
      className={
        "bg-base-200 border-base-300 rounded border px-2 py-1 font-mono text-base break-all" +
        (className ? " " + className : "")
      }
      data-testid={testid || "app-address"}
    >
      {address}
    </span>
  );
}
