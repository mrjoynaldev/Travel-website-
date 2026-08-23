import { useState } from "react";
import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function StudioAutomations() {
  const autos = trpc.studio.automations.list.useQuery();
  const postsFB = trpc.studio.automations.listPosts.useQuery({ platform: "facebook", limit: 20 });
  const postsIG = trpc.studio.automations.listPosts.useQuery({ platform: "instagram", limit: 20 });
  const create = trpc.studio.automations.create.useMutation({ onSuccess: () => { autos.refetch(); toast.success("Automation created"); }, onError: e => toast.error(e.message) });
  const del = trpc.studio.automations.delete.useMutation({ onSuccess: () => { autos.refetch(); toast.success("Deleted"); }, onError: e => toast.error(e.message) });
  const [form, setForm] = useState({ platform: "instagram" as "facebook"|"instagram", post_id: "", post_title: "", keyword: "GUIDE", dm_template: "Hey! Here’s your guide:", button_text: "Read Full Guide", button_url: "https://codereportglobal.indevs.in/articles/", follow_required: true, search: "" });

  const filteredPosts = (form.platform === "instagram" ? postsIG.data : postsFB.data)?.filter((p: any) => !form.search || p.title.toLowerCase().includes(form.search.toLowerCase()) || p.caption.toLowerCase().includes(form.search.toLowerCase())) ?? [];

  return <DashboardLayout>
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 border-b border-border pb-6"><p className="font-label text-[10px] text-primary">AUTOMATION</p><h1 className="mt-2 font-display text-3xl font-semibold">Comment → DM (private replies)</h1><p className="mt-2 text-sm text-muted-foreground">User comments keyword on your post/reel → DM with button in 3s (only if following when toggle on). 750/hour, 1/user/24h, 7-day window. Free API: 2 active automations unlimited DMs.</p></header>

      <section className="rounded-xl border border-border bg-white p-6">
        <h3 className="font-semibold">New automation</h3>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div><Label>Platform</Label><select value={form.platform} onChange={e=>setForm({...form, platform:e.target.value as any})} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"><option value="instagram">Instagram (17841430858092702)</option><option value="facebook">Facebook Page (1194345043773378)</option></select></div>
            <div><Label>Search posts by title</Label><Input value={form.search} onChange={e=>setForm({...form, search:e.target.value})} placeholder="Type to filter, e.g. GUIDE" className="mt-1" /></div>
          </div>
          <div><Label>Select post *</Label><select value={form.post_id} onChange={e=>{ const p=filteredPosts.find((x:any)=>x.id===e.target.value); setForm({...form, post_id:e.target.value, post_title:p?.title||""}); }} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"><option value="">— pick a post/reel —</option>{filteredPosts.map((p:any)=><option key={p.id} value={p.id}>{p.title.slice(0,70)} — {p.id.slice(0,12)}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">{filteredPosts.length} posts loaded. Instead of 20 last, search filters by title.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Keyword (custom comment title) *</Label><Input value={form.keyword} onChange={e=>setForm({...form, keyword:e.target.value})} placeholder="GUIDE" className="mt-1" /></div>
            <div className="flex items-end gap-3"><Switch checked={form.follow_required} onCheckedChange={v=>setForm({...form, follow_required:v})} /><Label>Follow required (only DM if following)</Label></div>
          </div>
          <div><Label>DM template *</Label><Textarea value={form.dm_template} onChange={e=>setForm({...form, dm_template:e.target.value})} placeholder="Hey {name}! Here’s your full guide:" rows={3} className="mt-1" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Button text</Label><Input value={form.button_text} onChange={e=>setForm({...form, button_text:e.target.value})} placeholder="Read Full Guide" className="mt-1" /></div>
            <div><Label>Button link (admin-managed) *</Label><Input value={form.button_url} onChange={e=>setForm({...form, button_url:e.target.value})} placeholder="https://codereportglobal.indevs.in/articles/..." className="mt-1" /></div>
          </div>
          <Button onClick={()=>{ if(!form.post_id||!form.keyword||!form.dm_template||!form.button_url) return toast.error("Fill post, keyword, DM and button link"); create.mutate(form); }} disabled={create.isPending}>Create automation</Button>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-border bg-white p-6">
        <h3 className="font-semibold">Active automations</h3>
        <div className="mt-4 space-y-3">
          {(autos.data ?? []).length ? (autos.data ?? []).map((a:any)=><div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"><div><p className="text-sm font-medium">{a.platform} · {a.post_title||a.post_id} · <span className="text-primary">{a.keyword}</span> {a.is_active?"● active":"○ paused"}</p><p className="text-xs text-muted-foreground">DM: {a.dm_template.slice(0,60)}… | Button: {a.button_text} → {a.button_url.slice(0,40)} | Follow: {a.follow_required?"yes":"no"}</p></div><Button variant="outline" size="sm" onClick={()=>del.mutate({id:a.id})}>Delete</Button></div>) : <p className="text-sm text-muted-foreground">No automations yet. Create one above.</p>}
        </div>
      </section>
    </div>
  </DashboardLayout>;
}
