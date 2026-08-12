import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { Router } from "wouter";
import { trpc } from "@/lib/trpc";
import { getTrpcUrl } from "@/lib/api";
import { startLogin } from "@/const";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import App from "./App";
import "@/index.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
const redirectToLoginIfUnauthorized = (error: unknown) => { if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) startLogin(); };
queryClient.getQueryCache().subscribe(event => { if (event.type === "updated" && event.action.type === "error") { redirectToLoginIfUnauthorized(event.query.state.error); console.error("[API Query Error]", event.query.state.error); } });
queryClient.getMutationCache().subscribe(event => { if (event.type === "updated" && event.action.type === "error") { redirectToLoginIfUnauthorized(event.mutation.state.error); console.error("[API Mutation Error]", event.mutation.state.error); } });
const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: getTrpcUrl(), transformer: superjson })] });
const app = <trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}><Router><App /></Router></QueryClientProvider></trpc.Provider>;
createRoot(document.getElementById("root")!).render(app);
