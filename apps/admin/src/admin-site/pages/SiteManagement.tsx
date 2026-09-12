"use client";

import DashboardLayout from "@/admin-site/components/DashboardLayout";
import { MediaUploadButton } from "@/admin-site/components/MediaUploadButton";
import { Button } from "@/components/ui/button";
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
import { ArrowDown, ArrowUp, FileText, Image, Loader2, Palette, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { toast } from "sonner";

function Workspace({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 border-b border-border pb-5 sm:mb-7 sm:pb-6">
          <p className="font-label text-[10px] text-primary">{eyebrow}</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
        </header>
        {children}
      </div>
    </DashboardLayout>
  );
}

type LinkItem = { label: string; path: string };

const TRUST_ICON_OPTIONS = ["Compass", "Route", "HeartHandshake", "MapPin", "Ship", "Binoculars", "Phone", "Star"];
const parseLinks = (source: string, label: string) => {
  const value = JSON.parse(source);
  if (
    !Array.isArray(value) ||
    value.some(
      item => typeof item?.label !== "string" || typeof item?.path !== "string"
    )
  )
    throw new Error(`${label} must be an array of { label, path } objects.`);
  return value as LinkItem[];
};

function parsePosition(value: string): { x: number; y: number } {
  const match = /^\s*(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*$/.exec(value || "");
  if (!match) return { x: 50, y: 50 };
  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
  return { x: clamp(Number(match[1])), y: clamp(Number(match[2])) };
}

/**
 * Click-to-set focal point: tap the important part of the photo and the
 * website keeps that area visible when it crops. Stored as "x% y%".
 */
function FocalPicker({
  imageUrl,
  value,
  onChange,
  hint,
  aspectClass,
}: {
  imageUrl: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
  aspectClass: string;
}) {
  const point = parsePosition(value);
  const pick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, Math.round(((event.clientX - rect.left) / rect.width) * 100)));
    const y = Math.min(100, Math.max(0, Math.round(((event.clientY - rect.top) / rect.height) * 100)));
    onChange(`${x}% ${y}%`);
  };
  const presets: Array<{ label: string; value: string }> = [
    { label: "Top", value: "50% 20%" },
    { label: "Center", value: "50% 50%" },
    { label: "Bottom", value: "50% 80%" },
  ];
  return (
    <div className="mt-3 rounded-xl border border-border bg-background/60 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Focus point — tap the part that must stay visible <span className="text-muted-foreground/70">({hint})</span>
      </p>
      <div
        role="button"
        tabIndex={0}
        aria-label="Set image focus point"
        onClick={pick}
        onKeyDown={event => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          pick({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, currentTarget: event.currentTarget } as ReactMouseEvent<HTMLDivElement>);
        }}
        className={`relative mt-2 w-full cursor-crosshair overflow-hidden rounded-lg ${aspectClass}`}
      >
        <img src={imageUrl} alt="Focus preview" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: value || undefined }} />
        <span
          aria-hidden="true"
          className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary/80 shadow"
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {presets.map(preset => (
          <Button
            key={preset.label}
            type="button"
            variant={value === preset.value ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">{point.x}% · {point.y}%</span>
      </div>
    </div>
  );
}

export function StudioBranding() {
  const settings = trpc.studio.settings.get.useQuery();
  const update = trpc.studio.settings.update.useMutation({
    onSuccess: () => {
      settings.refetch();
      toast.success("Brand settings saved and audited.");
    },
    onError: error => toast.error(error.message),
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoAlt, setLogoAlt] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1b563f");
  const [accentColor, setAccentColor] = useState("#e4a741");
  const [heroMediaType, setHeroMediaType] = useState<"image" | "video">("image");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroImagePosition, setHeroImagePosition] = useState("50% 50%");
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [heroEyebrow, setHeroEyebrow] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [safariImageUrl, setSafariImageUrl] = useState("");
  const [safariImagePosition, setSafariImagePosition] = useState("50% 50%");
  const [safariTitle, setSafariTitle] = useState("");
  const [safariText, setSafariText] = useState("");
  const [safariPoints, setSafariPoints] = useState("");
  const [aboutImageUrl, setAboutImageUrl] = useState("");
  const [aboutImagePosition, setAboutImagePosition] = useState("50% 50%");
  const [trustItems, setTrustItems] = useState<{ icon: string; title: string; desc: string }[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [navigation, setNavigation] = useState("[]");
  const [footerLinks, setFooterLinks] = useState("[]");
  useEffect(() => {
    const record = settings.data;
    if (!record) return;
    const brand = (record.settings?.brand || {}) as Record<string, string>;
    const contact = (record.settings?.contact || {}) as Record<string, string>;
    setName(record.site.name);
    setDescription(record.site.description || "");
    setTagline(brand.tagline || "");
    setLogoUrl(brand.logoUrl || "");
    setLogoAlt(brand.logoAlt || "");
    setFaviconUrl(brand.faviconUrl || "");
    setOgImage(brand.defaultOgImageUrl || "");
    setPrimaryColor(brand.primaryColor || "#1b563f");
    setAccentColor(brand.accentColor || "#e4a741");
    setHeroMediaType(brand.heroMediaType === "video" ? "video" : "image");
    setHeroImageUrl(brand.heroImageUrl || "");
    setHeroImagePosition(brand.heroImagePosition || "50% 50%");
    setHeroVideoUrl(brand.heroVideoUrl || "");
    setHeroEyebrow(brand.heroEyebrow || "");
    setHeroTitle(brand.heroTitle || "");
    setHeroSubtitle(brand.heroSubtitle || "");
    setSafariImageUrl(brand.safariImageUrl || "");
    setSafariImagePosition(brand.safariImagePosition || "50% 50%");
    setSafariTitle(brand.safariTitle || "");
    setSafariText(brand.safariText || "");
    setSafariPoints(Array.isArray(brand.safariPoints) ? brand.safariPoints.join("\n") : "");
    setAboutImageUrl(brand.aboutImageUrl || "");
    setAboutImagePosition(brand.aboutImagePosition || "50% 50%");
    setTrustItems(
      Array.isArray(brand.trustItems)
        ? brand.trustItems
            .filter((item): item is { icon?: string; title: string; desc: string } => !!item && typeof item.title === "string" && typeof item.desc === "string")
            .map(item => ({ icon: typeof item.icon === "string" ? item.icon : "Compass", title: item.title, desc: item.desc }))
            .slice(0, 6)
        : []
    );
    setContactName(contact.name || "");
    setContactEmail(contact.email || "");
    setNavigation(JSON.stringify(record.settings?.navigation || [], null, 2));
    setFooterLinks(
      JSON.stringify(record.settings?.footer_links || [], null, 2)
    );
  }, [settings.data]);
  const save = () => {
    try {
      const nav = parseLinks(navigation, "Navigation");
      const footer = parseLinks(footerLinks, "Footer links");
      update.mutate({
        name,
        description: description || undefined,
        customDomain: settings.data?.site.custom_domain || undefined,
        themeSettings: (settings.data?.site.theme_settings || {}) as Record<
          string,
          unknown
        >,
        navigation: nav,
        defaultLocale: settings.data?.settings?.default_locale || "en",
        timezone: settings.data?.settings?.timezone || "UTC",
        seoDefaults: (settings.data?.settings?.seo_defaults || {}) as Record<
          string,
          unknown
        >,
        featureFlags: (settings.data?.settings?.feature_flags || {}) as Record<
          string,
          boolean
        >,
        brand: {
          tagline,
          logoUrl,
          logoAlt,
          faviconUrl,
          defaultOgImageUrl: ogImage,
          primaryColor,
          accentColor,
          heroMediaType,
          heroImageUrl,
          heroImagePosition,
          heroVideoUrl,
          heroEyebrow,
          heroTitle,
          heroSubtitle,
          safariImageUrl,
          safariImagePosition,
          safariTitle,
          safariText,
          safariPoints: safariPoints.split("\n").map(line => line.trim()).filter(Boolean).slice(0, 6),
          aboutImageUrl,
          aboutImagePosition,
          trustItems,
        },
        footerLinks: footer,
        contact: { name: contactName, email: contactEmail },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Brand settings are invalid."
      );
    }
  };
  return (
    <Workspace
      title="Brand & site identity"
      eyebrow="Design · public publication"
    >
      <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex gap-3">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Publication identity
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These values are used across the public shell, footer, social
                preview defaults, and Studio.
              </p>
            </div>
          </div>
          {settings.isLoading ? (
            <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Website name
                </label>
                <Input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  rows={3}
                  className="mt-1.5 w-full bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Tagline
                </label>
                <Input
                  value={tagline}
                  onChange={event => setTagline(event.target.value)}
                  placeholder="A concise statement of your publication's purpose"
                  className="mt-1.5"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Primary color
                  </label>
                  <Input
                    value={primaryColor}
                    onChange={event => setPrimaryColor(event.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Accent color
                  </label>
                  <Input
                    value={accentColor}
                    onChange={event => setAccentColor(event.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <Button
                onClick={save}
                disabled={update.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {update.isPending ? "Saving…" : "Save identity"}
              </Button>
            </div>
          )}
        </section>
        <section className="rounded-xl border border-border bg-[#fbfcfa] p-6 shadow-sm">
          <div className="flex gap-3">
            <Image className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Brand media & links
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use S3 media-library URLs for logos and social images.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Logo (tap to upload)
              </label>
              {logoUrl ? (
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-border bg-white p-2">
                  <img src={logoUrl} alt={logoAlt || "Logo"} className="h-10 w-auto max-w-28 rounded object-contain" />
                  <div className="flex gap-2">
                    <MediaUploadButton
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                      folder="brand"
                      label="Replace"
                      onUploaded={asset => {
                        setLogoUrl(asset.url);
                        toast.success("Logo uploaded.");
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setLogoUrl("")}>
                      <X className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <MediaUploadButton
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  folder="brand"
                  label="Tap to upload logo"
                  className="mt-1.5"
                  onUploaded={asset => {
                    setLogoUrl(asset.url);
                    toast.success("Logo uploaded.");
                  }}
                />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Logo alternative text
              </label>
              <Input
                value={logoAlt}
                onChange={event => setLogoAlt(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Favicon (tap to upload)
              </label>
              {faviconUrl ? (
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-border bg-white p-2">
                  <img src={faviconUrl} alt="Favicon" className="h-8 w-8 rounded object-contain" />
                  <div className="flex gap-2">
                    <MediaUploadButton
                      accept="image/png,image/webp,image/gif,image/svg+xml,image/jpeg"
                      folder="brand"
                      label="Replace"
                      onUploaded={asset => {
                        setFaviconUrl(asset.url);
                        toast.success("Favicon uploaded.");
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setFaviconUrl("")}>
                      <X className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <MediaUploadButton
                  accept="image/png,image/webp,image/gif,image/svg+xml,image/jpeg"
                  folder="brand"
                  label="Tap to upload favicon"
                  className="mt-1.5"
                  onUploaded={asset => {
                    setFaviconUrl(asset.url);
                    toast.success("Favicon uploaded.");
                  }}
                />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Default social image (tap to upload)
              </label>
              {ogImage ? (
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-border bg-white p-2">
                  <img src={ogImage} alt="Social preview" className="h-12 w-20 rounded object-cover" />
                  <div className="flex gap-2">
                    <MediaUploadButton
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      folder="brand"
                      label="Replace"
                      onUploaded={asset => {
                        setOgImage(asset.url);
                        toast.success("Social image uploaded.");
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setOgImage("")}>
                      <X className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <MediaUploadButton
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  folder="brand"
                  label="Tap to upload social image"
                  className="mt-1.5"
                  onUploaded={asset => {
                    setOgImage(asset.url);
                    toast.success("Social image uploaded.");
                  }}
                />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Contact name
              </label>
              <Input
                value={contactName}
                onChange={event => setContactName(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Contact email
              </label>
              <Input
                value={contactEmail}
                onChange={event => setContactEmail(event.target.value)}
                placeholder="editor@example.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Primary navigation JSON
              </label>
              <Textarea
                value={navigation}
                onChange={event => setNavigation(event.target.value)}
                rows={5}
                className="mt-1.5 w-full bg-white p-3 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Footer links JSON
              </label>
              <Textarea
                value={footerLinks}
                onChange={event => setFooterLinks(event.target.value)}
                rows={5}
                className="mt-1.5 w-full bg-white p-3 font-mono text-xs"
              />
            </div>
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-label text-[10px] text-primary">Homepage hero</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              First-screen background
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              What travellers see first. Pick a still image or a streaming
              video loop — video uses the image as its loading poster.
            </p>
          </div>
          <div className="inline-flex self-start rounded-full border border-border bg-background p-1">
            {(["image", "video"] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setHeroMediaType(mode)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${heroMediaType === mode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="overflow-hidden rounded-xl bg-black">
              {heroMediaType === "video" && heroVideoUrl ? (
                <video src={heroVideoUrl} poster={heroImageUrl || undefined} controls preload="metadata" playsInline className="aspect-video w-full" />
              ) : heroImageUrl ? (
                <img src={heroImageUrl} alt={heroEyebrow || "Homepage hero preview"} className="aspect-video w-full object-cover" style={{ objectPosition: heroImagePosition || undefined }} />
              ) : (
                <div className="grid aspect-video w-full place-items-center bg-muted p-6 text-center text-sm text-muted-foreground">
                  No hero media yet — the site falls back to its bundled cover image.
                </div>
              )}
            </div>
            {heroImageUrl ? (
              <FocalPicker
                imageUrl={heroImageUrl}
                value={heroImagePosition}
                onChange={setHeroImagePosition}
                hint="best: wide 16:9 or wider, at least 1920 px"
                aspectClass="aspect-video"
              />
            ) : null}
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <label className="text-xs font-medium text-muted-foreground">
                Hero image (tap to upload — also the video poster)
              </label>
              {heroImageUrl ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <MediaUploadButton
                    accept="image/jpeg,image/png,image/webp"
                    folder="brand"
                    label="Replace image"
                    onUploaded={asset => {
                      setHeroImageUrl(asset.url);
                      toast.success("Hero image uploaded — save below to publish.");
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setHeroImageUrl("")}>
                    <X className="h-4 w-4" /> Remove
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <MediaUploadButton
                    accept="image/jpeg,image/png,image/webp"
                    folder="brand"
                    label="Tap to upload image"
                    onUploaded={asset => {
                      setHeroImageUrl(asset.url);
                      toast.success("Hero image uploaded — save below to publish.");
                    }}
                  />
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <label className="text-xs font-medium text-muted-foreground">
                Hero video loop (tap to upload · MP4/WebM · max 50 MB)
              </label>
              {heroVideoUrl ? (
                <div className="mt-2">
                  <p className="truncate font-mono text-xs text-muted-foreground">{heroVideoUrl.split("/").pop()}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <MediaUploadButton
                      accept="video/mp4,video/webm"
                      folder="brand"
                      maxMB={50}
                      label="Replace video"
                      onUploaded={asset => {
                        setHeroVideoUrl(asset.url);
                        setHeroMediaType("video");
                        toast.success("Hero video uploaded — save below to publish.");
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => { setHeroVideoUrl(""); setHeroMediaType("image"); }}>
                      <X className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <MediaUploadButton
                    accept="video/mp4,video/webm"
                    folder="brand"
                    maxMB={50}
                    label="Tap to upload video"
                    onUploaded={asset => {
                      setHeroVideoUrl(asset.url);
                      setHeroMediaType("video");
                      toast.success("Hero video uploaded — save below to publish.");
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Eyebrow line
              </label>
              <Input value={heroEyebrow} onChange={event => setHeroEyebrow(event.target.value)} placeholder="Sundarban Travel • Tours • Guides" className="mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Headline
              </label>
              <Input value={heroTitle} onChange={event => setHeroTitle(event.target.value)} placeholder="Plan Your Sundarban Journey with Confidence" className="mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Subheading
              </label>
              <Textarea value={heroSubtitle} onChange={event => setHeroSubtitle(event.target.value)} rows={2} placeholder="Discover mangrove waterways, wildlife, villages…" className="mt-1.5 w-full bg-background" />
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Empty headline fields keep the current homepage copy. Press
              “Save identity” above to publish hero changes.
            </p>
          </div>
        </div>
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <p className="font-label text-[10px] text-primary">Homepage safari block</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Safari feature</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Safari photo (tap to upload)
              </label>
              {safariImageUrl ? (
                <div className="mt-1.5 space-y-2">
                  <img src={safariImageUrl} alt="Safari preview" className="aspect-video w-full rounded-xl object-cover" />
                  <div className="flex flex-wrap gap-2">
                    <MediaUploadButton
                      accept="image/jpeg,image/png,image/webp"
                      folder="brand"
                      label="Replace photo"
                      onUploaded={asset => {
                        setSafariImageUrl(asset.url);
                        toast.success("Safari photo uploaded — save to publish.");
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setSafariImageUrl("")}>
                      <X className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1.5">
                  <MediaUploadButton
                    accept="image/jpeg,image/png,image/webp"
                    folder="brand"
                    label="Tap to upload photo"
                    onUploaded={asset => {
                      setSafariImageUrl(asset.url);
                      toast.success("Safari photo uploaded — save to publish.");
                    }}
                  />
                </div>
              )}
              {safariImageUrl ? (
                <FocalPicker
                  imageUrl={safariImageUrl}
                  value={safariImagePosition}
                  onChange={setSafariImagePosition}
                  hint="shown wide — landscape photos work best"
                  aspectClass="aspect-video"
                />
              ) : null}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Heading</label>
              <Input value={safariTitle} onChange={event => setSafariTitle(event.target.value)} placeholder="Creeks, watchtowers and quiet patience" className="mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Intro text</label>
              <Textarea value={safariText} onChange={event => setSafariText(event.target.value)} rows={3} className="mt-1.5 w-full bg-background" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Checklist (one per line, max 6)</label>
              <Textarea value={safariPoints} onChange={event => setSafariPoints(event.target.value)} rows={3} className="mt-1.5 w-full bg-background font-mono text-xs" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <p className="font-label text-[10px] text-primary">About page</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Story photo</h2>
            {aboutImageUrl ? (
              <div className="mt-4 space-y-2">
                <img src={aboutImageUrl} alt="About preview" className="aspect-[4/3] w-full rounded-xl object-cover" />
                <div className="flex flex-wrap gap-2">
                  <MediaUploadButton
                    accept="image/jpeg,image/png,image/webp"
                    folder="brand"
                    label="Replace photo"
                    onUploaded={asset => {
                      setAboutImageUrl(asset.url);
                      toast.success("About photo uploaded — save to publish.");
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setAboutImageUrl("")}>
                    <X className="h-4 w-4" /> Remove
                  </Button>
                </div>
                <FocalPicker
                  imageUrl={aboutImageUrl}
                  value={aboutImagePosition}
                  onChange={setAboutImagePosition}
                  hint="shown 4:3 — landscape photos work best"
                  aspectClass="aspect-[4/3]"
                />
              </div>
            ) : (
              <div className="mt-4">
                <MediaUploadButton
                  accept="image/jpeg,image/png,image/webp"
                  folder="brand"
                  label="Tap to upload photo"
                  onUploaded={asset => {
                    setAboutImageUrl(asset.url);
                    toast.success("About photo uploaded — save to publish.");
                  }}
                />
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-label text-[10px] text-primary">Homepage trust badges</p>
                <h2 className="mt-2 font-display text-2xl font-semibold">Why choose us</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={trustItems.length >= 6}
                onClick={() => setTrustItems(items => [...items, { icon: "Compass", title: "", desc: "" }].slice(0, 6))}
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {trustItems.map((item, index) => (
                <div key={index} className="rounded-xl border border-border bg-background/60 p-3">
                  <div className="grid gap-2 sm:grid-cols-[130px_1fr_auto]">
                    <Select value={TRUST_ICON_OPTIONS.includes(item.icon) ? item.icon : "Compass"} onValueChange={value => setTrustItems(items => items.map((it, i) => (i === index ? { ...it, icon: value } : it)))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TRUST_ICON_OPTIONS.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input value={item.title} onChange={event => setTrustItems(items => items.map((it, i) => (i === index ? { ...it, title: event.target.value } : it)))} placeholder="Badge heading" />
                    <div className="flex gap-1.5">
                      <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => setTrustItems(items => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} aria-label="Move up">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" disabled={index === trustItems.length - 1} onClick={() => setTrustItems(items => { const next = [...items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })} aria-label="Move down">
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setTrustItems(items => items.filter((_, i) => i !== index))} aria-label="Remove badge">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea value={item.desc} onChange={event => setTrustItems(items => items.map((it, i) => (i === index ? { ...it, desc: event.target.value } : it)))} rows={2} placeholder="One or two honest sentences" className="mt-2 w-full bg-white text-sm" />
                </div>
              ))}
              {!trustItems.length && (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No badges — the homepage falls back to its bundled set until you add some.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </Workspace>
  );
}

export function StudioPages() {
  const [pageType, setPageType] = useState<
    "privacy" | "terms" | "contact" | "custom"
  >("privacy");
  const page = trpc.studio.pages.get.useQuery({ pageType });
  const list = trpc.studio.pages.list.useQuery();
  const savePage = trpc.studio.pages.save.useMutation({
    onSuccess: () => {
      page.refetch();
      list.refetch();
      toast.success("Public page saved and audited.");
    },
    onError: error => toast.error(error.message),
  });
  const [title, setTitle] = useState("Privacy policy");
  const [slug, setSlug] = useState("privacy");
  const [html, setHtml] = useState(
    "<h2>Your privacy matters</h2><p>Explain how this publication collects, uses, and protects personal information here. Review this copy for your jurisdiction before publishing.</p>"
  );
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "published"
  );
  useEffect(() => {
    const data = page.data;
    if (data) {
      setTitle(data.title);
      setSlug(data.slug);
      setHtml(data.rendered_html);
      setMetaTitle(data.meta_title || "");
      setMetaDescription(data.meta_description || "");
      setStatus(data.status);
    } else {
      const defaults = {
        privacy: ["Privacy policy", "privacy"],
        terms: ["Terms of use", "terms"],
        contact: ["Contact", "contact"],
        custom: ["New page", "new-page"],
      } as const;
      setTitle(defaults[pageType][0]);
      setSlug(defaults[pageType][1]);
      setHtml(
        pageType === "privacy"
          ? "<h2>Your privacy matters</h2><p>Explain your data practices here. Review this page for your jurisdiction before publishing.</p>"
          : "<p>Write this public page here.</p>"
      );
      setMetaTitle("");
      setMetaDescription("");
      setStatus("published");
    }
  }, [page.data, pageType]);
  const save = () =>
    savePage.mutate({
      pageType,
      title,
      slug,
      renderedHtml: html,
      contentJson: { type: "doc", content: [] },
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      status,
    });
  return (
    <Workspace title="Public pages" eyebrow="Legal · contact · custom">
      <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
        <aside className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="font-label text-[10px] text-primary">Page type</p>
          <Select
            value={pageType}
            onValueChange={value => setPageType(value as typeof pageType)}
          >
            <SelectTrigger className="mt-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="privacy">Privacy policy</SelectItem>
              <SelectItem value="terms">Terms of use</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="custom">Custom page</SelectItem>
            </SelectContent>
          </Select>
          <div className="mt-6 border-t border-border pt-5">
            <p className="font-label text-[10px] text-muted-foreground">
              Published pages
            </p>
            <div className="mt-3 space-y-2">
              {list.data?.map(item => (
                <div key={item.id} className="rounded-lg bg-muted/60 p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    /{item.slug} · {item.status}
                  </p>
                </div>
              ))}
              {!list.data?.length && (
                <p className="text-sm text-muted-foreground">
                  No public pages yet.
                </p>
              )}
            </div>
          </div>
        </aside>
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-2xl font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Content is sanitized before public rendering. Legal content
                requires owner or counsel review before release.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Page title
              </label>
              <Input
                value={title}
                onChange={event => setTitle(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Slug
              </label>
              <Input
                value={slug}
                onChange={event =>
                  setSlug(
                    event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                  )
                }
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-xs font-medium text-muted-foreground">
              Sanitized HTML content
            </label>
            <Textarea
              value={html}
              onChange={event => setHtml(event.target.value)}
              rows={12}
              className="mt-1.5 w-full bg-background p-3 font-mono text-xs leading-5"
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Meta title
              </label>
              <Input
                value={metaTitle}
                onChange={event => setMetaTitle(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Meta description
              </label>
              <Input
                value={metaDescription}
                onChange={event => setMetaDescription(event.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Select
              value={status}
              onValueChange={value => setStatus(value as typeof status)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={save}
              disabled={savePage.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {savePage.isPending ? "Saving…" : "Save page"}
            </Button>
          </div>
        </section>
      </div>
    </Workspace>
  );
}
