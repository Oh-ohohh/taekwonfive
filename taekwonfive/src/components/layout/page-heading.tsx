import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, action }: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 py-1">
      <div>
        <p className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-accent">
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />{eyebrow}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
