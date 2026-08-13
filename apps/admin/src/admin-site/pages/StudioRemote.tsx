"use client";

import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { VNCViewer } from "@/admin-site/components/VNCViewer";

export function StudioRemote() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-label text-[10px] text-primary">Remote access</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
              Remote desktop
            </h1>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            A browser-based VNC viewer with a trackpad-style cursor for mobile.
            Connect to any VNC server exposed through a WebSocket proxy.
          </p>
        </header>
        <div className="h-[calc(100vh-14rem)]">
          <VNCViewer />
        </div>
      </div>
    </DashboardLayout>
  );
}
