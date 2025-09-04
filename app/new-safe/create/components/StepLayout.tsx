import React from "react";

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
}: StepLayoutProps) {
  return (
    <div
      className={`bg-base-100 col-span-12 container flex flex-col gap-8 rounded p-8 shadow-xl md:col-span-7`}
    >
      {title && <h2 className="text-xl font-bold">{title}</h2>}
      {description && <p className="text-base-content">{description}</p>}
      {children}
      {actions && (
        <div className="mt-auto flex justify-between gap-4">{actions}</div>
      )}
    </div>
  );
}
