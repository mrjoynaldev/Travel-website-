"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { publicArticleUrl } from "@/admin-site/lib/publicSite";
import DashboardLayout from "@/admin-site/components/DashboardLayout";
import {
  Activity,
  ExternalLink,
  Flame,
  Globe2,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

const GEOS = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "IN", label: "India" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "BR", label: "Brazil" },
  { code: "JP", label: "Japan" },
  { code: "NG", label: "Nigeria" },
  { code: "ZA", label: "South Africa" },
];

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: typeof Flame;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TrafficSection() {
  const [days, setDays] = useState("28");
  const status = trpc.studio.research.status.useQuery();
  const overview = trpc.studio.research.gaOverview.useQuery({ days: Number(days) });

  if (!status.data) return <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-primary" />;

  if (!status.data.googleAnalytics) {
    return (
      <SectionCard
        icon={Activity}
        title="Google Analytics traffic"
        description="Live visitors, pageviews and top articles once connected."
      >
        <div className="rounded-lg border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-medium text-foreground">Not connected yet.</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Create a GA4 web stream for your site and copy its Measurement ID (<code>G-…</code>).</li>
            <li>Add it as <code>NEXT_PUBLIC_GA_MEASUREMENT_ID</code> on the website deployment.</li>
            <li>Add a service account key as <code>GA_PROPERTY_ID</code>, <code>GA_CLIENT_EMAIL</code>, <code>GA_PRIVATE_KEY</code> on the API server, and grant the service account email Viewer access in GA4.</li>
          </ol>
          <p className="mt-2">This panel fills with live data within ~24–48 hours of the tag going live.</p>
        </div>
      </SectionCard>
    );
  }

  const data = overview.data;

  return (
    <SectionCard
      icon={Activity}
      title="Google Analytics traffic"
      description={`Property ${status.data.propertyId} · live from GA4`}
      action={
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="28">Last 28 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {overview.isLoading ? (
        <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-primary" />
      ) : data?.configured ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Visitors" value={String(data.totals.activeUsers)} hint="active users" />
            <StatTile label="Sessions" value={String(data.totals.sessions)} />
            <StatTile label="Pageviews" value={String(data.totals.pageviews)} />
            <StatTile
              label="Engagement"
              value={`${Math.round(data.totals.engagementRate * 100)}%`}
              hint={`${Math.round(data.totals.avgSessionSeconds)}s avg session`}
            />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top pages & articles</p>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {data.topPages.map((page: any) => (
                  <li key={page.path} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <a
                      href={page.path.startsWith("/articles/") ? `${publicArticleUrl(page.path.replace("/articles/", ""))}` : page.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate hover:text-primary"
                    >
                      {page.title || page.path}
                    </a>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {page.views} views
                    </span>
                  </li>
                ))}
                {!data.topPages.length && <li className="px-3 py-4 text-sm text-muted-foreground">No page data yet.</li>}
              </ul>
            </div>
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top countries</p>
                <div className="flex flex-wrap gap-2">
                  {data.countries.map((c: any) => (
                    <span key={c.country} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                      {c.country} · {c.users}
                    </span>
                  ))}
                  {!data.countries.length && <p className="text-sm text-muted-foreground">No country data yet.</p>}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Traffic sources</p>
                <div className="flex flex-wrap gap-2">
                  {data.sources.map((s: any) => (
                    <span key={s.source} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                      {s.source} · {s.sessions}
                    </span>
                  ))}
                  {!data.sources.length && <p className="text-sm text-muted-foreground">No source data yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {overview.error?.message ?? "GA4 is configured but returned no data yet — new properties can take up to 48 hours."}
        </p>
      )}
    </SectionCard>
  );
}

function TrendsSection() {
  const [geo, setGeo] = useState("IN");
  const trends = trpc.studio.research.trends.useQuery({ geo });

  return (
    <SectionCard
      icon={Flame}
      title="Google Trends — trending searches"
      description="What the world is searching right now. Filter for angles that touch Sundarban tours, safari and trip planning."
      action={
        <Select value={geo} onValueChange={setGeo}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {GEOS.map(g => (
              <SelectItem key={g.code} value={g.code}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {trends.isLoading ? (
        <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-primary" />
      ) : trends.error ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{trends.error.message}</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {(trends.data?.items ?? []).slice(0, 15).map((item, index) => (
            <li key={item.title} className="px-3 py-2.5">
              <div className="flex items-baseline gap-2">
                <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">{index + 1}.</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                {item.traffic && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {item.traffic} searches
                  </span>
                )}
              </div>
              {item.news.length > 0 && (
                <p className="ml-7 mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.news[0]}</p>
              )}
            </li>
          ))}
          {!trends.data?.items.length && (
            <li className="px-3 py-4 text-sm text-muted-foreground">No trending items for this region right now.</li>
          )}
        </ul>
      )}
    </SectionCard>
  );
}

function HnSection() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const hn = trpc.studio.research.hackerNews.useQuery({ query: submitted || undefined, limit: 15 });
  const stories = hn.data?.stories ?? [];

  return (
    <SectionCard
      icon={Globe2}
      title="Hacker News signal"
      description="Front-page dev stories or search any topic to gauge interest."
      action={
        <form
          className="flex gap-2"
          onSubmit={event => {
            event.preventDefault();
            setSubmitted(query.trim());
          }}
        >
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search topic… e.g. rust, agents"
            className="h-9 w-44 rounded-md border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary sm:w-56"
          />
          <Button size="sm" variant="outline" type="submit">Search</Button>
        </form>
      }
    >
      {hn.isLoading ? (
        <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-primary" />
      ) : hn.error ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{hn.error.message}</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {stories.map((story: any) => (
            <li key={story.objectID} className="flex items-start gap-3 px-3 py-2.5">
              <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                ▲ {story.points}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{story.title}</p>
                <p className="text-xs text-muted-foreground">{story.comments} comments</p>
              </div>
              <a href={story.url} target="_blank" rel="noopener noreferrer" className="shrink-0 pt-1">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
              </a>
            </li>
          ))}
          {!stories.length && <li className="px-3 py-4 text-sm text-muted-foreground">No stories found.</li>}
        </ul>
      )}
    </SectionCard>
  );
}

export default function StudioResearch() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 border-b border-border pb-5 sm:mb-7 sm:pb-6">
          <p className="font-label text-[10px] text-primary">Insights</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
            Research & trends
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Live traffic from Google Analytics plus real-time search and
            travel signals to fuel your next Sundarban guide ideas.
          </p>
        </header>
        <div className="space-y-6">
          <TrafficSection />
          <TrendsSection />
          <HnSection />
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
            Tip: ask your AI agent to run <code className="mx-1">node cli/blog.mjs research trends</code> and propose Sundarban guide angles from this same data.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
