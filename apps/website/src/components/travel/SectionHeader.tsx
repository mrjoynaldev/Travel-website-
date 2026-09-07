import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  desc,
  action,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  action?: ReactNode;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div className={`mb-8 lg:mb-12 flex flex-wrap items-end justify-between gap-5 ${centered ? "flex-col items-center text-center" : ""}`}>
      <div className={centered ? "max-w-2xl" : "max-w-2xl"}>
        <p className="font-label text-[11px] lg:text-xs text-primary">{eyebrow}</p>
        <h2 className="mt-3 h2 font-display text-foreground">{title}</h2>
        {desc && <p className="mt-3 body-lg text-muted-foreground !text-[1.02rem] !leading-[1.7]">{desc}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <span aria-hidden="true" className="text-border">/</span>}
          {item.href ? (
            <a href={item.href} className="hover:text-primary hover:underline underline-offset-4">
              {item.label}
            </a>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
