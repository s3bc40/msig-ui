import React from "react";

interface AppSectionProps {
  children: React.ReactNode;
  className?: string;
  testid?: string;
}

export default function AppSection({
  children,
  className,
  testid,
}: AppSectionProps) {
  return (
    <section
      className={
        "container mx-auto flex flex-col gap-8 p-10" +
        (className ? " " + className : "")
      }
      data-testid={testid || "app-section"}
    >
      {children}
    </section>
  );
}
