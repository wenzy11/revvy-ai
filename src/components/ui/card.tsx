"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[color:var(--border)] bg-white shadow-sm shadow-blue-100/60",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-5 py-4">
      <div>
        <div className="text-lg font-semibold text-blue-950">{title}</div>
        {subtitle ? (
          <div className="mt-1 text-sm text-[color:var(--muted)]">{subtitle}</div>
        ) : null}
      </div>
      {right}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

