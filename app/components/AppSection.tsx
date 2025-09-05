import React from "react";

interface AppSectionProps {
  children: React.ReactNode;
  className?: string;
}

export default function AppSection({ children, className }: AppSectionProps) {
  return (
    <section
      className={
        "container mx-auto flex flex-col gap-8 p-10" +
        (className ? " " + className : "")
      }
    >
      {children}
    </section>
  );
}
