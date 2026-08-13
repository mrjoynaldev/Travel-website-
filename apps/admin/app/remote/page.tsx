"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, Monitor } from "lucide-react";
import Link from "next/link";
import { VNCViewer } from "@/admin-site/components/VNCViewer";

export default function RemotePage() {
  useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-white px-5 py-3">
        <Link
          href="/studio"
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to studio"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
          <Monitor className="h-4 w-4" />
        </div>
        <div>
          <p className="font-label text-[10px] text-primary">Remote desktop</p>
          <p className="font-display text-lg font-semibold leading-tight">
            VNC viewer
          </p>
        </div>
      </header>
      <main className="min-h-0 flex-1 p-4">
        <VNCViewer />
      </main>
    </div>
  );
}
