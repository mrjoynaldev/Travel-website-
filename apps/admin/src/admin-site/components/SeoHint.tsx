"use client";

import { cn } from "@/lib/utils";

export function SeoHint({ value, min, max, ideal }: { value: string; min?: number; max: number; ideal?: string }) {
  const length = value.trim().length;
  const tone =
    length === 0
      ? "text-muted-foreground"
      : length > max
        ? "text-destructive"
        : min && length < min
          ? "text-amber-600"
          : "text-primary";
  return (
    <p className={cn("mt-1 text-[11px]", tone)}>
      {length} / {min ? `${min}–${max}` : max} characters{ideal ? ` · ${ideal}` : ""}
    </p>
  );
}
