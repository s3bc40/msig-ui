import React from "react";
import AppCard from "@/app/components/AppCard";

interface StepLayoutProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function StepLayout({
  title,
  description,
  actions,
  children,
  className,
}: StepLayoutProps) {
  return (
    <AppCard
      title={title}
      className={"col-span-12 md:col-span-7 " + (className ?? "")}
    >
      {description && <p className="text-base-content mb-4">{description}</p>}
      <div className="flex flex-1 flex-col gap-4">{children}</div>
      {actions && (
        <div className="mt-auto flex justify-between gap-4">{actions}</div>
      )}
    </AppCard>
  );
}
