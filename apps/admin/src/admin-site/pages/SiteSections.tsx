"use client";

import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  LayoutTemplate,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SectionType = "featured" | "latest" | "category" | "tag" | "custom";
type SectionDraft = {
  title: string;
  sectionType: SectionType;
  categoryId: string;
  tagId: string;
  subtitle: string;
  renderedHtml: string;
  isVisible: boolean;
};

const emptyDraft: SectionDraft = {
  title: "",
  sectionType: "latest",
  categoryId: "",
  tagId: "",
  subtitle: "",
  renderedHtml: "",
  isVisible: true,
};

const typeLabels: Record<SectionType, string> = {
  featured: "Featured stories",
  latest: "Latest stories",
  category: "Category feed",
  tag: "Tag feed",
  custom: "Custom editorial block",
};

function Workspace({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 border-b border-border pb-5 sm:mb-7 sm:pb-6">
          <p className="font-label text-[10px] text-primary">
            Design · homepage
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
            Homepage sections
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Compose the public homepage from ordered story feeds and sanitized
            editorial blocks. Changes are scoped to this publication.
          </p>
        </header>
        {children}
      </div>
    </DashboardLayout>
  );
}

export default function StudioSections() {
  const sections = trpc.studio.sections.list.useQuery();
  const taxonomy = trpc.studio.taxonomy.list.useQuery();
  const [draft, setDraft] = useState<SectionDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const updateDraft = <K extends keyof SectionDraft>(
    key: K,
    value: SectionDraft[K]
  ) => setDraft(current => ({ ...current, [key]: value }));
  const selectedSection = useMemo(
    () => sections.data?.find(section => section.id === editingId),
    [editingId, sections.data]
  );

  useEffect(() => {
    if (!selectedSection) return;
    setDraft({
      title: selectedSection.title,
      sectionType: selectedSection.section_type as SectionType,
      categoryId: selectedSection.category_id || "",
      tagId: selectedSection.tag_id || "",
      subtitle: selectedSection.subtitle || "",
      renderedHtml: selectedSection.rendered_html || "",
      isVisible: selectedSection.is_visible,
    });
  }, [selectedSection]);

  const reset = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };
  const save = trpc.studio.sections.create.useMutation({
    onSuccess: () => {
      sections.refetch();
      reset();
      toast.success("Homepage section created.");
    },
    onError: error => toast.error(error.message),
  });
  const update = trpc.studio.sections.update.useMutation({
    onSuccess: () => {
      sections.refetch();
      reset();
      toast.success("Homepage section updated.");
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.studio.sections.remove.useMutation({
    onSuccess: () => {
      sections.refetch();
      if (editingId) reset();
      toast.success("Homepage section removed.");
    },
    onError: error => toast.error(error.message),
  });
  const reorder = trpc.studio.sections.reorder.useMutation({
    onSuccess: () => sections.refetch(),
    onError: error => toast.error(error.message),
  });

  const submit = () => {
    if (!draft.title.trim()) {
      toast.error("Give the section a title.");
      return;
    }
    if (draft.sectionType === "category" && !draft.categoryId) {
      toast.error("Choose a category for this feed.");
      return;
    }
    if (draft.sectionType === "tag" && !draft.tagId) {
      toast.error("Choose a tag for this feed.");
      return;
    }
    const input = {
      title: draft.title.trim(),
      sectionType: draft.sectionType,
      categoryId: draft.sectionType === "category" ? draft.categoryId : null,
      tagId: draft.sectionType === "tag" ? draft.tagId : null,
      subtitle: draft.subtitle.trim() || undefined,
      renderedHtml:
        draft.sectionType === "custom" ? draft.renderedHtml : undefined,
      isVisible: draft.isVisible,
    };
    if (editingId) {
      const current = sections.data?.find(section => section.id === editingId);
      if (!current) return;
      update.mutate({ ...input, id: editingId, sortOrder: current.sort_order });
    } else {
      save.mutate(input);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const ordered = sections.data?.map(section => section.id) ?? [];
    const next = index + direction;
    if (next < 0 || next >= ordered.length) return;
    [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
    reorder.mutate({ ids: ordered });
  };

  return (
    <Workspace>
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className="h-fit rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-2xl font-semibold">
                  {editingId ? "Edit section" : "Add section"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Feed blocks show up to six published stories.
                </p>
              </div>
            </div>
            {editingId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={reset}
                aria-label="Cancel editing"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Section title
              </label>
              <Input
                value={draft.title}
                onChange={event => updateDraft("title", event.target.value)}
                placeholder="e.g. Research worth reading"
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Section type
              </label>
              <Select
                value={draft.sectionType}
                onValueChange={value => {
                  const next = value as SectionType;
                  updateDraft("sectionType", next);
                  if (next !== "category") updateDraft("categoryId", "");
                  if (next !== "tag") updateDraft("tagId", "");
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {draft.sectionType === "category" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <Select
                  value={draft.categoryId}
                  onValueChange={value => updateDraft("categoryId", value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxonomy.data?.categories.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {draft.sectionType === "tag" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Tag
                </label>
                <Select
                  value={draft.tagId}
                  onValueChange={value => updateDraft("tagId", value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Choose a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxonomy.data?.tags.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        #{item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Subtitle
              </label>
              <Input
                value={draft.subtitle}
                onChange={event => updateDraft("subtitle", event.target.value)}
                placeholder="A short line below the heading"
                className="mt-1.5"
              />
            </div>
            {draft.sectionType === "custom" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Editorial HTML
                </label>
                <Textarea
                  value={draft.renderedHtml}
                  onChange={event =>
                    updateDraft("renderedHtml", event.target.value)
                  }
                  placeholder="<p>A short editorial note...</p>"
                  rows={7}
                  className="mt-1.5 font-mono text-xs"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Scripts and unsafe attributes are removed before rendering.
                </p>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.isVisible}
                onCheckedChange={checked =>
                  updateDraft("isVisible", checked === true)
                }
              />
              Visible on the public homepage
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={submit}
                disabled={save.isPending || update.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {editingId ? "Save section" : "Add section"}
              </Button>
              {!editingId && (
                <Button
                  variant="outline"
                  onClick={() => setDraft(emptyDraft)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-5">
            <p className="font-label text-[10px] text-primary">Public order</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              What readers see
            </h2>
          </div>
          {sections.isLoading ? (
            <div className="grid min-h-48 place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : sections.data?.length ? (
            <div className="divide-y divide-border">
              {sections.data.map((section, index) => (
                <div
                  key={section.id}
                  className={`p-5 ${!section.is_visible ? "bg-muted/30" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{section.title}</h3>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {typeLabels[section.section_type as SectionType] ||
                            section.section_type}
                        </span>
                        {!section.is_visible && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {section.subtitle || "No subtitle"}
                        {section.categories?.name
                          ? ` · ${section.categories.name}`
                          : section.tags?.name
                            ? ` · #${section.tags.name}`
                            : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => move(index, -1)}
                        disabled={index === 0 || reorder.isPending}
                        aria-label="Move section up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => move(index, 1)}
                        disabled={
                          index === sections.data!.length - 1 ||
                          reorder.isPending
                        }
                        aria-label="Move section down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(section.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        aria-label={`Edit ${section.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove “${section.title}” from the homepage?`
                            )
                          )
                            remove.mutate({ id: section.id, confirmed: true });
                        }}
                        aria-label={`Remove ${section.title}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {section.is_visible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                    {section.is_visible ? "Visible" : "Hidden"} · Position{" "}
                    {index + 1}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-14 text-center">
              <LayoutTemplate className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-display text-2xl font-semibold">
                Your homepage is ready to compose.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a story feed or editorial block to give readers a guided
                entry point.
              </p>
            </div>
          )}
        </section>
      </div>
    </Workspace>
  );
}
