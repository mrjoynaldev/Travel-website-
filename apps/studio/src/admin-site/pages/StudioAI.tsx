import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu, KeyRound, Loader2, Plus, Power, RefreshCw, Trash2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const providerTypes = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google Gemini" },
  { value: "nvidia", label: "Nvidia NIM" },
  { value: "custom", label: "Custom (OpenAI-compatible)" },
] as const;

const taskLabels: Record<string, string> = {
  outline: "Article outline",
  improve: "Editorial suggestions",
  meta: "SEO meta copy",
  summarize: "Executive summary",
  agent_chat: "Publication agent chat",
};

type ProviderRow = { id: string; provider_type: string; name: string; base_url: string | null; is_active: boolean; api_key_masked: string };
type ModelRow = { id: string; owned_by: string };

export function StudioAIProviders() {
  const providers = trpc.llm.providers.list.useQuery();
  const tasks = trpc.llm.tasks.list.useQuery();
  const createProvider = trpc.llm.providers.create.useMutation({ onSuccess: data => { providers.refetch(); setModelsCache(prev => ({ ...prev, [data.provider.id]: data.models })); toast.success(`${data.provider.name} connected with ${data.models.length} models.`); }, onError: error => toast.error(error.message) });
  const updateProvider = trpc.llm.providers.update.useMutation({ onSuccess: () => { providers.refetch(); toast.success("Provider updated."); }, onError: error => toast.error(error.message) });
  const removeProvider = trpc.llm.providers.remove.useMutation({ onSuccess: () => { providers.refetch(); tasks.refetch(); toast.success("Provider removed."); }, onError: error => toast.error(error.message) });
  const setTask = trpc.llm.tasks.set.useMutation({ onSuccess: () => { tasks.refetch(); toast.success("Task routing saved."); }, onError: error => toast.error(error.message) });
  const testProvider = trpc.llm.providers.test.useMutation({ onSuccess: result => { if (result.ok) toast.success(`Provider replied: ${result.content}`); else toast.error(`Provider test failed: ${result.content}`); }, onError: error => toast.error(error.message) });

  const [form, setForm] = useState({ providerType: "openai" as string, name: "", apiKey: "", baseUrl: "" });
  const [modelsCache, setModelsCache] = useState<Record<string, ModelRow[]>>({});
  const [modelsTarget, setModelsTarget] = useState<string | null>(null);
  const modelsQuery = trpc.llm.providers.models.useQuery({ providerId: modelsTarget ?? "" }, { enabled: false });
  const [selection, setSelection] = useState<Record<string, { providerId: string; model: string }>>({});

  useEffect(() => {
    if (modelsTarget) {
      modelsQuery.refetch().then(result => {
        if (result.data) setModelsCache(prev => ({ ...prev, [modelsTarget]: result.data }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsTarget]);

  useEffect(() => {
    if (tasks.data) {
      const next: Record<string, { providerId: string; model: string }> = {};
      for (const row of tasks.data) {
        if (row.providerId) next[row.task] = { providerId: row.providerId, model: row.model || "" };
      }
      setSelection(prev => ({ ...prev, ...next }));
      for (const row of tasks.data) {
        if (row.providerId && !modelsCache[row.providerId]) setModelsTarget(row.providerId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.data]);

  const loadModels = (providerId: string) => {
    if (!modelsCache[providerId]) setModelsTarget(providerId);
  };

  const submitProvider = () => {
    if (!form.name.trim() || !form.apiKey.trim()) { toast.error("Name and API key are required."); return; }
    if (form.providerType === "custom" && !form.baseUrl.trim()) { toast.error("Custom providers need a base URL."); return; }
    createProvider.mutate({ providerType: form.providerType as "openai" | "anthropic" | "gemini" | "nvidia" | "custom", name: form.name.trim(), apiKey: form.apiKey.trim(), baseUrl: form.baseUrl.trim() || undefined });
  };

  return <DashboardLayout><div className="mx-auto max-w-7xl"><header className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-label text-[10px] text-primary">MULTI-PROVIDER ROUTING</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">AI providers</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Add any provider's API key and its available models are discovered automatically. Route each editorial task to the model you choose. Keys are stored server-side and never exposed to the browser.</p></div></header>

    <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3"><Cpu className="h-5 w-5 text-primary" /><div><h2 className="font-display text-2xl font-semibold">Connect a provider</h2><p className="mt-1 text-sm text-muted-foreground">OpenAI, Anthropic, Gemini, Nvidia NIM, or any OpenAI-compatible endpoint.</p></div></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr_1fr_1fr_auto]">
        <div><label className="text-xs font-medium text-muted-foreground">Provider</label><Select value={form.providerType} onValueChange={value => setForm(prev => ({ ...prev, providerType: value }))}><SelectTrigger className="mt-1.5 bg-white"><SelectValue /></SelectTrigger><SelectContent>{providerTypes.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
        <div><label className="text-xs font-medium text-muted-foreground">Display name</label><Input value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="e.g. OpenAI production" className="mt-1.5" /></div>
        <div><label className="text-xs font-medium text-muted-foreground">API key</label><Input type="password" value={form.apiKey} onChange={event => setForm(prev => ({ ...prev, apiKey: event.target.value }))} placeholder="sk-…" className="mt-1.5" /></div>
        <div><label className="text-xs font-medium text-muted-foreground">Base URL {form.providerType !== "custom" && <span className="text-muted-foreground/60">(optional)</span>}</label><Input value={form.baseUrl} onChange={event => setForm(prev => ({ ...prev, baseUrl: event.target.value }))} placeholder={form.providerType === "custom" ? "https://gateway.example/v1" : "Defaults to the provider"} className="mt-1.5" /></div>
        <div className="flex items-end"><Button onClick={submitProvider} disabled={createProvider.isPending} className="gap-2"><Plus className="h-4 w-4" />{createProvider.isPending ? "Connecting…" : "Connect"}</Button></div>
      </div>
    </section>

    <section className="mt-7 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-4"><h2 className="font-display text-2xl font-semibold">Connected providers</h2></div>
      {providers.isLoading ? <div className="grid min-h-32 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : providers.data?.length ? providers.data.map(provider => (
        <div key={provider.id} className="flex flex-col gap-3 border-b border-border p-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3"><div className={`h-2.5 w-2.5 rounded-full ${provider.is_active ? "bg-emerald-500" : "bg-stone-300"}`} /><div><p className="font-medium capitalize">{provider.name} <span className="ml-1 text-xs text-muted-foreground capitalize">({provider.provider_type.replace("_", " ")})</span></p><p className="mt-1 text-xs text-muted-foreground">{provider.api_key_masked}{provider.base_url ? ` · ${provider.base_url}` : ""}</p></div></div>
          <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" className="gap-1.5" onClick={() => loadModels(provider.id)}><RefreshCw className="h-3.5 w-3.5" />Refresh models</Button><Button size="sm" variant="outline" className="gap-1.5" onClick={() => updateProvider.mutate({ id: provider.id, isActive: !provider.is_active })}><Power className="h-3.5 w-3.5" />{provider.is_active ? "Disable" : "Enable"}</Button><Button size="sm" variant="destructive" className="gap-1.5" onClick={() => { if (window.confirm(`Remove ${provider.name}? Task routing that uses it will be cleared.`)) removeProvider.mutate({ id: provider.id }); }}><Trash2 className="h-3.5 w-3.5" />Remove</Button></div>
        </div>
      )) : <p className="p-12 text-center text-sm text-muted-foreground">No providers connected. Add one above, or set OPENAI_API_KEY in the server environment as a fallback.</p>}
    </section>

    <section className="mt-7 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl font-semibold">Task routing</h2><p className="mt-1 text-sm text-muted-foreground">Choose which provider model handles each editorial task.</p></div>{modelsTarget && <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><RefreshCw className="h-3 w-3 animate-spin" />Discovering models…</span>}</div>
      <div className="divide-y divide-border">{taskLabels && Object.entries(taskLabels).map(([task, label]) => { const current = selection[task]; const providerId = current?.providerId || ""; const modelOptions = providerId ? (modelsCache[providerId] ?? []) : []; return (
        <div key={task} className="grid gap-3 p-5 lg:grid-cols-[1fr_220px_1fr_auto] lg:items-center">
          <div><p className="font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{current?.model ? `${current.model}${current.providerId ? "" : ""}` : "No model assigned — falls back to OPENAI_API_KEY"}</p></div>
          <Select value={providerId} onValueChange={value => { loadModels(value); setSelection(prev => ({ ...prev, [task]: { providerId: value, model: "" } })); }}><SelectTrigger className="w-full bg-white"><SelectValue placeholder="Provider" /></SelectTrigger><SelectContent>{providers.data?.filter(item => item.is_active).map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
          <Select value={current?.model || ""} onValueChange={value => setSelection(prev => ({ ...prev, [task]: { providerId: prev[task]?.providerId || "", model: value } }))}><SelectTrigger className="w-full bg-white"><SelectValue placeholder={modelOptions.length ? "Select a model" : "No models yet"} /></SelectTrigger><SelectContent>{modelOptions.map(model => <SelectItem key={model.id} value={model.id}>{model.id}</SelectItem>)}</SelectContent></Select>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!providerId || !current?.model} onClick={() => testProvider.mutate({ providerId, model: current!.model })}>{testProvider.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}Test</Button>
            <Button size="sm" className="gap-1.5" disabled={!providerId || !current?.model || setTask.isPending} onClick={() => setTask.mutate({ task: task as "outline" | "improve" | "meta" | "summarize" | "agent_chat", providerId, model: current!.model })}>{setTask.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}Save routing</Button>
          </div>
        </div>); })}</div>
    </section>
  </div></DashboardLayout>;
}
