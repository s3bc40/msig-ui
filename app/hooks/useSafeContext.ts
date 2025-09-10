import { useContext } from "react";
import { SafeContext } from "@/app/provider/SafeProvider";

export function useSafeContext() {
  const ctx = useContext(SafeContext);
  if (!ctx)
    throw new Error("useProtocolKit must be used within a SafeProvider");
  return ctx;
}
