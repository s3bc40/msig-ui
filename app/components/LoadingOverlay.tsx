"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoadingOverlay() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500); // Simulate loading for UX
    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="bg-neutral/80 pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <span className="loading loading-bars loading-xl text-accent/100 bg-accent/100"></span>
    </div>
  );
}
