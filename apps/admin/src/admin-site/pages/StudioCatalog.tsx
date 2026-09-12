"use client";

import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { MediaUploadButton } from "@/admin-site/components/MediaUploadButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  HelpCircle,
  Loader2,
  Pencil,
  PhoneCall,
  Plus,
  Trash2,
  Boxes,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type TourDetail = {
  startPoint: string;
  overview: string[];
  highlights: string[];
  gallery: string[];
  itinerary: { day: string; title: string; desc: string }[];
  inclusions: string[];
  exclusions: string[];
  meetingPoint: string;
  transport: string;
  stay: string;
};
type TourRecord = {
  id: string;
  slug: string;
  title: string;
  duration: string;
  days: number;
  category: string;
  summary: string;
  image_url: string | null;
  featured: boolean;
  price_note: string | null;
  best_for: string | null;
  detail: TourDetail;
  sort_order: number;
  status: "draft" | "published";
};
type FaqRecord = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  status: "draft" | "published";
};
const emptyDetail: TourDetail = {
  startPoint: "",
  overview: [],
  highlights: [],
  gallery: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  meetingPoint: "",
  transport: "",
  stay: "",
};

const statusPill = (status: string) =>
  status === "published"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-slate-100 text-slate-700";

function lines(value: string): string[] {
  return value.split("\n").map(line => line.trim()).filter(Boolean);
}

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

function Frame({
  title,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  eyebrow: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
          <div>
            <p className="font-label text-[10px] text-primary">{eyebrow}</p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
          </div>
          {actions}
        </header>
        {children}
      </div>
    </DashboardLayout>
  );
}

// ————————————————————————————————————————————————————————————————————————
// Tours
// ————————————————————————————————————————————————————————————————————————

function tourToInput(tour: TourRecord) {
  return {
    title: tour.title,
    slug: tour.slug,
    duration: tour.duration ?? "",
    days: tour.days ?? 1,
    category: tour.category ?? "",
    summary: tour.summary ?? "",
    imageUrl: tour.image_url ?? "",
    featured: tour.featured ?? false,
    priceNote: tour.price_note ?? "",
    bestFor: tour.best_for ?? "",
    detail: tour.detail ?? emptyDetail,
    sortOrder: tour.sort_order ?? 0,
    status: tour.status ?? "draft",
  };
}

export function StudioCatalogTours() {
  const tours = trpc.studio.catalog.tours.list.useQuery();
  const create = trpc.studio.catalog.tours.create.useMutation({
    onSuccess: () => { tours.refetch(); toast.success("Tour created."); },
    onError: e => toast.error(e.message),
  });
  const update = trpc.studio.catalog.tours.update.useMutation({
    onSuccess: () => { tours.refetch(); toast.success("Tour saved."); },
    onError: e => toast.error(e.message),
  });
  const remove = trpc.studio.catalog.tours.remove.useMutation({
    onSuccess: () => { tours.refetch(); toast.success("Tour deleted."); },
    onError: e => toast.error(e.message),
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TourRecord | null>(null);
  const [form, setForm] = useState({
    title: "", slug: "", duration: "", days: "1", category: "", summary: "",
    imageUrl: "", featured: false, priceNote: "", bestFor: "", status: "draft" as "draft" | "published",
    startPoint: "", overview: "", highlights: "", gallery: "",
    itinerary: "", inclusions: "", exclusions: "", meetingPoint: "", transport: "", stay: "",
  });

  const openNew = () => {
    setEditing(null);
    setForm({
      title: "", slug: "", duration: "", days: "1", category: "", summary: "",
      imageUrl: "", featured: false, priceNote: "", bestFor: "", status: "draft",
      startPoint: "", overview: "", highlights: "", gallery: "",
      itinerary: "", inclusions: "", exclusions: "", meetingPoint: "", transport: "", stay: "",
    });
    setEditorOpen(true);
  };
  const openEdit = (tour: TourRecord) => {
    setEditing(tour);
    const d = tour.detail ?? emptyDetail;
    setForm({
      title: tour.title, slug: tour.slug, duration: tour.duration ?? "",
      days: String(tour.days ?? 1), category: tour.category ?? "", summary: tour.summary ?? "",
      imageUrl: tour.image_url ?? "", featured: tour.featured ?? false,
      priceNote: tour.price_note ?? "", bestFor: tour.best_for ?? "", status: tour.status ?? "draft",
      startPoint: d.startPoint ?? "",
      overview: (d.overview ?? []).join("\n"),
      highlights: (d.highlights ?? []).join("\n"),
      gallery: (d.gallery ?? []).join("\n"),
      itinerary: (d.itinerary ?? []).map(item => `${item.day} | ${item.title} | ${item.desc}`).join("\n"),
      inclusions: (d.inclusions ?? []).join("\n"),
      exclusions: (d.exclusions ?? []).join("\n"),
      meetingPoint: d.meetingPoint ?? "", transport: d.transport ?? "", stay: d.stay ?? "",
    });
    setEditorOpen(true);
  };

  const save = () => {
    if (!form.title.trim()) { toast.error("Give the tour a title."); return; }
    const itinerary = form.itinerary
      .split("\n").map(line => line.trim()).filter(Boolean)
      .map(line => {
        const [day, title, ...rest] = line.split("|").map(part => part.trim());
        return { day: day || "Day", title: title || "", desc: rest.join(" | ") };
      });
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      duration: form.duration.trim(),
      days: Math.max(1, Number.parseInt(form.days, 10) || 1),
      category: form.category.trim(),
      summary: form.summary.trim(),
      imageUrl: form.imageUrl.trim(),
      featured: form.featured,
      priceNote: form.priceNote.trim(),
      bestFor: form.bestFor.trim(),
      detail: {
        startPoint: form.startPoint.trim(),
        overview: lines(form.overview),
        highlights: lines(form.highlights),
        gallery: lines(form.gallery),
        itinerary,
        inclusions: lines(form.inclusions),
        exclusions: lines(form.exclusions),
        meetingPoint: form.meetingPoint.trim(),
        transport: form.transport.trim(),
        stay: form.stay.trim(),
      },
      sortOrder: editing?.sort_order ?? 0,
      status: form.status,
    };
    if (editing) update.mutate({ id: editing.id, data: payload }, { onSuccess: () => setEditorOpen(false) });
    else create.mutate(payload, { onSuccess: () => setEditorOpen(false) });
  };

  return (
    <Frame
      title="Tours"
      eyebrow="Catalogue · what travellers can book"
      actions={
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New tour
        </Button>
      }
    >
      <p className="mb-5 max-w-2xl text-sm text-muted-foreground">
        Published tours appear on /tours, the homepage, /hire and tour detail
        pages. Detail fields (overview, itinerary, inclusions) use one item per
        line; itinerary lines use <code>Day | Title | Description</code>.
      </p>
      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {tours.isLoading ? (
          <div className="grid min-h-32 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : tours.data?.length ? (
          tours.data.map(tour => (
            <div key={tour.id} className="flex flex-col gap-3 border-b border-border p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{tour.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusPill(tour.status)}`}>{tour.status}</span>
                  {tour.featured && <span className="rounded-full bg-[#f5e7cc] px-2 py-0.5 text-[10px] font-medium text-[#8a6420]">Featured</span>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  /tours/{tour.slug} · {tour.duration || "no duration"} · {tour.days} day(s){tour.category ? ` · ${tour.category}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(tour)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { if (window.confirm(`Delete "${tour.title}"?`)) remove.mutate({ id: tour.id }); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="p-12 text-center text-sm text-muted-foreground">
            No tours yet. The public site falls back to bundled data until a tour is published here.
          </p>
        )}
      </section>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.title}` : "New tour"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Slug (optional)</label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto from title" className="mt-1" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Duration text</label>
                <Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="3 Days • 2 Nights" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Days</label>
                <Input type="number" min={1} value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category / group</label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Festival special" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Summary</label>
              <Textarea rows={2} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <label className="text-xs font-medium text-muted-foreground">Cover image (tap to upload · shown wide 3:2, landscape works best)</label>
                {form.imageUrl ? (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={form.imageUrl} alt="" className="h-16 w-24 rounded-lg object-cover" />
                    <div className="flex gap-2">
                      <MediaUploadButton accept={IMAGE_ACCEPT} folder="tours" label="Replace" onUploaded={asset => setForm(f => ({ ...f, imageUrl: asset.url }))} />
                      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}>
                        <X className="h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <MediaUploadButton accept={IMAGE_ACCEPT} folder="tours" label="Tap to upload cover" onUploaded={asset => setForm(f => ({ ...f, imageUrl: asset.url }))} />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Price note</label>
                <Input value={form.priceNote} onChange={e => setForm(f => ({ ...f, priceNote: e.target.value }))} placeholder="Festival dates" className="mt-1" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Best for</label>
                <Input value={form.bestFor} onChange={e => setForm(f => ({ ...f, bestFor: e.target.value }))} className="mt-1" />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                  Featured
                </label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as "draft" | "published" }))}>
                  <SelectTrigger className="h-10 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-2 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tour detail</p>
              <div className="mt-3 grid gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Start point</label>
                  <Input value={form.startPoint} onChange={e => setForm(f => ({ ...f, startPoint: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Overview (one paragraph per line)</label>
                  <Textarea rows={3} value={form.overview} onChange={e => setForm(f => ({ ...f, overview: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Highlights (one per line)</label>
                  <Textarea rows={3} value={form.highlights} onChange={e => setForm(f => ({ ...f, highlights: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Gallery (one image per line — or tap to upload & append)</label>
                    <MediaUploadButton accept={IMAGE_ACCEPT} folder="tours" label="Tap to upload" onUploaded={asset => setForm(f => ({ ...f, gallery: f.gallery ? `${f.gallery}\n${asset.url}` : asset.url }))} />
                  </div>
                  <Textarea rows={3} value={form.gallery} onChange={e => setForm(f => ({ ...f, gallery: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Itinerary — one day per line: Day | Title | Description</label>
                  <Textarea rows={4} value={form.itinerary} onChange={e => setForm(f => ({ ...f, itinerary: e.target.value }))} className="mt-1 font-mono text-xs" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Inclusions (one per line)</label>
                    <Textarea rows={3} value={form.inclusions} onChange={e => setForm(f => ({ ...f, inclusions: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Exclusions (one per line)</label>
                    <Textarea rows={3} value={form.exclusions} onChange={e => setForm(f => ({ ...f, exclusions: e.target.value }))} className="mt-1" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Meeting point</label>
                    <Input value={form.meetingPoint} onChange={e => setForm(f => ({ ...f, meetingPoint: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Transport</label>
                    <Input value={form.transport} onChange={e => setForm(f => ({ ...f, transport: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Stay</label>
                    <Input value={form.stay} onChange={e => setForm(f => ({ ...f, stay: e.target.value }))} className="mt-1" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={create.isPending || update.isPending}>
                {create.isPending || update.isPending ? "Saving…" : editing ? "Save tour" : "Create tour"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Frame>
  );
}

// ————————————————————————————————————————————————————————————————————————
// FAQs
// ————————————————————————————————————————————————————————————————————————

export function StudioCatalogFaqs() {
  const faqs = trpc.studio.catalog.faqs.list.useQuery();
  const create = trpc.studio.catalog.faqs.create.useMutation({
    onSuccess: () => { faqs.refetch(); toast.success("FAQ created."); },
    onError: e => toast.error(e.message),
  });
  const update = trpc.studio.catalog.faqs.update.useMutation({
    onSuccess: () => { faqs.refetch(); toast.success("FAQ saved."); },
    onError: e => toast.error(e.message),
  });
  const remove = trpc.studio.catalog.faqs.remove.useMutation({
    onSuccess: () => { faqs.refetch(); toast.success("FAQ deleted."); },
    onError: e => toast.error(e.message),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");

  const startEdit = (faq: FaqRecord) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setStatus(faq.status);
  };
  const save = () => {
    if (!question.trim() || !answer.trim()) { toast.error("Question and answer are required."); return; }
    const payload = { question: question.trim(), answer: answer.trim(), sortOrder: 0, status };
    if (editingId) update.mutate({ id: editingId, data: payload }, { onSuccess: () => setEditingId(null) });
    else create.mutate(payload, { onSuccess: () => { setQuestion(""); setAnswer(""); } });
  };

  return (
    <Frame title="FAQs" eyebrow="Catalogue · traveller questions">
      <p className="mb-5 max-w-2xl text-sm text-muted-foreground">
        Published FAQs appear on the homepage, /tours, /hire, /contact and tour
        pages. Order follows the list below.
      </p>
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <p className="font-label text-[10px] text-primary">Add a question</p>
        <div className="mt-3 grid gap-3">
          <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question travellers actually ask" />
          <Textarea rows={3} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Honest, specific answer" />
          <div className="flex items-center gap-3">
            <Select value={status} onValueChange={v => setStatus(v as "draft" | "published")}>
              <SelectTrigger className="h-10 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={save} disabled={create.isPending || update.isPending} className="gap-2">
              {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? "Save FAQ" : "Add FAQ"}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={() => { setEditingId(null); setQuestion(""); setAnswer(""); }}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </section>
      <section className="mt-6 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {faqs.isLoading ? (
          <div className="grid min-h-32 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : faqs.data?.length ? (
          faqs.data.map(faq => (
            <div key={faq.id} className="border-b border-border p-5 last:border-b-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
                    <p className="font-medium">{faq.question}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusPill(faq.status)}`}>{faq.status}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(faq)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => { if (window.confirm("Delete this FAQ?")) remove.mutate({ id: faq.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="p-12 text-center text-sm text-muted-foreground">No FAQs yet — the site shows bundled defaults until you add some.</p>
        )}
      </section>
    </Frame>
  );
}

// ————————————————————————————————————————————————————————————————————————
// Business / contact settings
// ————————————————————————————————————————————————————————————————————————

const CONTACT_FIELDS: { key: string; label: string; placeholder?: string }[] = [
  { key: "name", label: "Business name" },
  { key: "tagline", label: "Tagline" },
  { key: "organiser", label: "Organiser / owner" },
  { key: "location", label: "Location" },
  { key: "phoneDisplay", label: "Phone (display)", placeholder: "+91 85138 19474" },
  { key: "phone", label: "Phone (tel: link)", placeholder: "+918513819474" },
  { key: "whatsapp", label: "WhatsApp (wa.me digits)", placeholder: "918513819474" },
  { key: "email", label: "Email" },
  { key: "hours", label: "Working hours" },
];

export function StudioBusiness() {
  const business = trpc.studio.business.get.useQuery();
  const update = trpc.studio.business.update.useMutation({
    onSuccess: () => { business.refetch(); toast.success("Business details saved. The public site updates on its next render."); },
    onError: e => toast.error(e.message),
  });
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    if (business.data) setValues(business.data as Record<string, string>);
  }, [business.data]);

  return (
    <Frame title="Business & contact" eyebrow="Site · how travellers reach you">
      <p className="mb-5 max-w-2xl text-sm text-muted-foreground">
        These details power every call / WhatsApp / email CTA across the public
        site — contact page, tour pages, sticky bars and the trip planner.
      </p>
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <PhoneCall className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl font-semibold">Contact details</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {CONTACT_FIELDS.map(field => (
            <div key={field.key}>
              <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
              <Input
                value={values[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          ))}
        </div>
        <Button
          className="mt-6"
          disabled={update.isPending}
          onClick={() => {
            const contact: Record<string, string> = {};
            for (const field of CONTACT_FIELDS) {
              const value = (values[field.key] ?? "").trim();
              if (value) contact[field.key] = value;
            }
            update.mutate({ contact });
          }}
        >
          {update.isPending ? "Saving…" : "Save business details"}
        </Button>
      </section>
      <section className="mt-6 rounded-xl border border-[#d6e2d1] bg-[#eff6ec] p-5 text-sm text-[#31513d]">
        <p className="flex items-center gap-2 font-medium"><Boxes className="h-4 w-4" /> How this flows</p>
        <p className="mt-2 leading-6">
          Saved values are stored on the site settings record and served through
          the public API. Until a field is set here, the site keeps using the
          bundled defaults, so nothing breaks if this page is left empty.
        </p>
      </section>
    </Frame>
  );
}
