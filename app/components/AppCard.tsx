import React from "react";

interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function AppCard({
  children,
  className,
  title,
  actions,
}: AppCardProps) {
  return (
    <div
      className={
        "bg-base-100 border-primary flex flex-col gap-4 rounded border-2 p-10 shadow-lg" +
        (className ? " " + className : "")
      }
    >
      {title && <h2 className="mb-4 text-xl font-bold">{title}</h2>}
      {children}
      {actions && <div className="mt-4 flex justify-end gap-2">{actions}</div>}
    </div>
  );
}
