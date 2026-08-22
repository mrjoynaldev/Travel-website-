"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Bell,
  Bot,
  Boxes,
  Cpu,
  Download,
  FileText,
  Images,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Mail,
  MessageSquare,
  Palette,
  PanelLeft,
  ScrollText,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Tags,
  UploadCloud,
  Users,
  X,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { CSSProperties, useEffect, useRef, useState } from "react";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MenuItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  adminOnly?: boolean;
};
const menuGroups: { label: string; items: MenuItem[] }[] = [
  {
    label: "Start",
    items: [{ icon: LayoutDashboard, label: "Overview", path: "/studio" }],
  },
  {
    label: "Create",
    items: [
      { icon: FileText, label: "New story", path: "/studio/posts/new" },
      { icon: Boxes, label: "New space", path: "/studio/gravity" },
      { icon: UploadCloud, label: "Upload media", path: "/studio/media" },
    ],
  },
  {
    label: "Content",
    items: [
      { icon: FileText, label: "Posts", path: "/studio/posts" },
      { icon: Boxes, label: "Gravity editor", path: "/studio/gravity" },
      { icon: Images, label: "Media", path: "/studio/media" },
      { icon: Tags, label: "Categories & tags", path: "/studio/taxonomy" },
      {
        icon: LayoutTemplate,
        label: "Homepage",
        path: "/studio/sections",
        adminOnly: true,
      },
      { icon: MessageSquare, label: "Moderation", path: "/studio/moderation" },
    ],
  },
  {
    label: "Audience",
    items: [
      { icon: Mail, label: "Subscribers", path: "/studio/subscribers" },
      { icon: Bell, label: "Outbox", path: "/studio/notifications" },
    ],
  },
  {
    label: "Insights",
    items: [
      { icon: BarChart3, label: "Analytics", path: "/studio/analytics" },
      { icon: TrendingUp, label: "Research & trends", path: "/studio/research" },
    ],
  },
  {
    label: "People",
    items: [{ icon: Users, label: "Team", path: "/studio/team" }],
  },
  {
    label: "Automation",
    items: [
      { icon: Bot, label: "AI Agent", path: "/studio/agent" },
      { icon: Cpu, label: "AI Providers", path: "/studio/ai" },
    ],
  },
  {
    label: "Site",
    items: [
      { icon: Settings2, label: "Settings", path: "/studio/settings" },
      { icon: Palette, label: "Brand", path: "/studio/brand" },
      { icon: FileText, label: "Public pages", path: "/studio/pages" },
    ],
  },
  {
    label: "System",
    items: [
      {
        icon: ShieldCheck,
        label: "Capabilities",
        path: "/studio/capabilities",
      },
      { icon: ScrollText, label: "Audit log", path: "/studio/audit" },
      { icon: Download, label: "Export", path: "/studio/export" },
      { icon: KeyRound, label: "API tokens", path: "/studio/api-tokens" },
      { icon: Send, label: "Distribution", path: "/studio/distribution" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

const bottomNavItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/studio" },
  { icon: FileText, label: "Posts", path: "/studio/posts" },
  { icon: Boxes, label: "Gravity", path: "/studio/gravity" },
  { icon: Images, label: "Media", path: "/studio/media" },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [menuSearch, setMenuSearch] = useState("");
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Sign in with
              your publication account.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent
        setSidebarWidth={setSidebarWidth}
        menuSearch={menuSearch}
        setMenuSearch={setMenuSearch}
      >
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  menuSearch: string;
  setMenuSearch: (value: string) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  menuSearch,
  setMenuSearch,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuGroups
    .flatMap(group => group.items)
    .find(item => item.path === pathname);
  const isMobile = useIsMobile();
  const { data: publication } = trpc.blog.publication.useQuery();
  const { data: bootstrap } = trpc.studio.bootstrap.useQuery();
  const studioName = `${publication?.name || "CodeReport Global"} Studio`;
  const visibleMenuGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(
        item =>
          (!item.adminOnly || bootstrap?.actor.role === "admin") &&
          (menuSearch.trim() === "" ||
            item.label.toLowerCase().includes(menuSearch.toLowerCase()))
      ),
    }))
    .filter(group => group.items.length);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-3">
            <div className="flex w-full items-center gap-3 transition-all">
              <button
                onClick={toggleSidebar}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex min-w-0 flex-1 items-center gap-2 group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold tracking-tight">
                  {studioName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuSearch("")}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors group-data-[collapsible=icon]:hidden"
                aria-label="Clear search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto p-3">
            <div className="mb-2 px-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={menuSearch}
                  onChange={event => setMenuSearch(event.target.value)}
                  placeholder="Search…"
                  className="h-10 bg-background/60 pl-9 pr-9 text-sm"
                  aria-label="Search menu"
                />
                {menuSearch && (
                  <button
                    type="button"
                    onClick={() => setMenuSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            {visibleMenuGroups.map((group, groupIndex) => (
              <div key={group.label} className={groupIndex > 0 ? "mt-4 border-t border-sidebar-border/60 pt-3" : ""}>
                <SidebarGroupLabel className="px-3 py-1 font-label text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {group.items.map(item => {
                      const isActive = pathname === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => {
                              router.push(item.path);
                              setMenuSearch("");
                            }}
                            tooltip={item.label}
                            className="h-11 gap-3 rounded-lg px-3 text-sm transition-all group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center"
                          >
                            <item.icon
                              className={`h-[18px] w-[18px] shrink-0 ${
                                isActive ? "text-primary" : "text-muted-foreground"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </div>
            ))}
            {!visibleMenuGroups.length && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No menu items match “{menuSearch}”.
              </p>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/60 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 pb-24 sm:pb-4">{children}</main>
      </SidebarInset>

      {isMobile && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:backdrop-blur sm:hidden"
          aria-label="Main navigation"
        >
          <div className="grid h-14 grid-cols-5">
            {bottomNavItems.map(item => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => router.push(item.path)}
                  className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors"
            >
              <PanelLeft className="h-5 w-5" />
              <span>More</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
