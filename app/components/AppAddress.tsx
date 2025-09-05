import React from "react";

interface AppAddressProps {
  address: string;
  className?: string;
}

export default function AppAddress({ address, className }: AppAddressProps) {
  return (
    <span
      className={
        "bg-base-200 border-base-300 rounded border px-2 py-1 font-mono text-base break-all" +
        (className ? " " + className : "")
      }
    >
      {address}
    </span>
  );
}
