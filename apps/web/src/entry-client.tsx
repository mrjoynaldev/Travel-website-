import { HydrationBoundary, type DehydratedState, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot, hydrateRoot } from "react-dom/client";
import superjson from "superjson";
import { Router } from "wouter";
import { trpc } from "@/lib/trpc";
import { getTrpcUrl } from "@/lib/api";
import App from "./App";
import "@/index.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: getTrpcUrl(), transformer: superjson })] });
const rawState = (window as any).__RQ_STATE__; const dehydratedState = (rawState ? superjson.deserialize(rawState) : undefined) as DehydratedState | undefined;
const app = <trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}><HydrationBoundary state={dehydratedState}><Router><App /></Router></HydrationBoundary></QueryClientProvider></trpc.Provider>;
const mount = document.getElementById("root")!;
if (mount.firstChild) hydrateRoot(mount, app); else createRoot(mount).render(app);
