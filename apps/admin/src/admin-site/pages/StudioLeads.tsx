"use client";

import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  CalendarDays,
  Loader2,
  Mail,
  Phone,
  Search,
  Target,
  Users,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const LEAD_STATUSES = ["new", "contacted", "won", "lost"] as const;
type LeadStatus = (typeof LEAD_STATUSES)[number];

const statusStyles: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-amber-100 text-amber-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-stone-200 text-stone-700",
};
const sourceStyles: Record<string, string> = {
  "lead-form": "bg-slate-100 text-slate-700",
  "tour-sundarban-winter-festival": "bg-[#f5e7cc] text-[#8a6420]",
  "tour-sundarban-hilsa-festival": "bg-[#ddebe3] text-[#185c43]",
};

function stripPhone(value?: string | null) {
  return (value ?? "").replace(/\D/g, "");
}
// The business is India-based; local 10-digit numbers get the +91 prefix for wa.me / tel.
function waUrl(phone?: string | null) {
  const digits = stripPhone(phone);
  if (!digits) return null;
  const intl = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${intl}`;
}
function telHref(phone?: string | null) {
  const digits = stripPhone(phone);
  if (!digits) return null;
  return `tel:${digits.length === 10 ? `+91${digits}` : `+${digits}`}`;
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  travel_date: string | null;
  travellers: string | null;
  tour_slug: string | null;
  need: string | null;
  source: string | null;
  status: LeadStatus;
  created_at: string;
};

export default function StudioLeads() {
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<string>("all");
  const leads = trpc.studio.leads.list.useQuery({});
  const updateStatus = trpc.studio.leads.updateStatus.useMutation({
    onSuccess: () => {
      leads.refetch();
      toast.success("Lead status updated.");
    },
    onError: error => toast.error(error.message),
  });

  const all = (leads.data ?? []) as Lead[];
  const sources = useMemo(
    () => Array.from(new Set(all.map(l => l.source).filter(Boolean))) as string[],
    [all]
  );
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: all.length, new: 0, contacted: 0, won: 0, lost: 0 };
    for (const lead of all) map[lead.status] = (map[lead.status] ?? 0) + 1;
    return map;
  }, [all]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter(lead => {
      if (status !== "all" && lead.status !== status) return false;
      if (source !== "all" && lead.source !== source) return false;
      if (!term) return true;
      return [lead.name, lead.email, lead.phone, lead.need, lead.tour_slug]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term));
    });
  }, [all, status, source, search]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
          <div>
            <p className="font-label text-[10px] text-primary">
              Enquiries · trip planning funnel
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              Leads
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Enquiries from the /hire plan-trip form and tour links, triaged by
            pipeline stage.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {(["all", ...LEAD_STATUSES] as const).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`rounded-xl border p-5 text-left transition-colors ${
                status === key
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-white text-foreground shadow-sm hover:border-primary/40"
              }`}
            >
              <p
                className={`font-label text-[10px] ${
                  status === key ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                {key === "all" ? "Total" : statusLabel(key)}
              </p>
              <p className="mt-3 font-display text-4xl font-semibold">
                {counts[key] ?? 0}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search name, phone, email, message…"
              className="bg-white pl-9"
            />
          </div>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-full bg-white sm:w-56">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map(item => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <section className="mt-6 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          {leads.isLoading ? (
            <div className="grid min-h-48 place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length ? (
            filtered.map(lead => {
              const wa = waUrl(lead.phone);
              const tel = telHref(lead.phone);
              const email = lead.email || null;
              const sourceClass = sourceStyles[lead.source ?? ""] ?? "bg-slate-100 text-slate-700";
              return (
                <div
                  key={lead.id}
                  className="grid gap-4 border-b border-border p-5 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_260px]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{lead.name}</p>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[lead.status]}`}
                      >
                        {statusLabel(lead.status)}
                      </span>
                      {lead.tour_slug && (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium capitalize text-muted-foreground">
                          {lead.tour_slug}
                        </span>
                      )}
                      {lead.source && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${sourceClass}`}
                        >
                          {lead.source}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {lead.need || "No message left."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      {lead.phone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {lead.phone}
                        </span>
                      )}
                      {email && (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <a
                            href={`mailto:${email}`}
                            className="text-primary hover:underline"
                          >
                            {email}
                          </a>
                        </span>
                      )}
                      {lead.travel_date && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {lead.travel_date}
                        </span>
                      )}
                      {lead.travellers != null && lead.travellers !== "" && (
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {lead.travellers} traveller{Number(lead.travellers) === 1 ? "" : "s"}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:items-end">
                    <div className="flex items-center gap-2">
                      {tel && (
                        <Button size="sm" variant="outline" asChild className="gap-1.5">
                          <a href={tel}>
                            <Phone className="h-3.5 w-3.5" />
                            Call
                          </a>
                        </Button>
                      )}
                      {wa && (
                        <Button size="sm" asChild className="gap-1.5">
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              updateStatus.mutate({ id: lead.id, status: "contacted" })
                            }
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        </Button>
                      )}
                      {email && (
                        <Button size="sm" variant="outline" asChild className="gap-1.5">
                          <a href={`mailto:${email}`}>
                            <Mail className="h-3.5 w-3.5" />
                            Email
                          </a>
                        </Button>
                      )}
                    </div>
                    <div className="flex w-full items-center gap-2 lg:w-auto">
                      <Select
                        value={lead.status}
                        onValueChange={value =>
                          updateStatus.mutate({ id: lead.id, status: value as LeadStatus })
                        }
                      >
                        <SelectTrigger className="h-8 w-full bg-white text-xs lg:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map(item => (
                            <SelectItem key={item} value={item}>
                              {statusLabel(item)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ArrowRight className="hidden h-4 w-4 text-muted-foreground lg:block" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid min-h-48 place-items-center p-10 text-center">
              <div>
                <Target className="mx-auto h-8 w-8 text-primary/50" />
                <p className="mt-3 font-display text-xl font-semibold">
                  No leads match these filters
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enquiries appear here the moment a traveller submits the plan-trip form.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
