"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Clock3, MessageCircle, Send, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { trpcClient } from "@web/lib/trpc-client";

export default function HireView() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [need, setNeed] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !need.trim()) {
      toast.error("Please fill name, email and what you need.");
      return;
    }
    setSubmitting(true);
    try {
      await trpcClient.blog.submitLead.mutate({ name: name.trim(), email: email.trim(), need: need.trim(), source: "hire-page" });
      toast.success("Sent — I’ll reply within 12h.");
      setName(""); setEmail(""); setNeed("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send. Try WhatsApp/Email below.");
    } finally { setSubmitting(false); }
  };

  return <>
    <section className="paper-grid border-b border-border"><div className="container py-16 md:py-20">
      <p className="font-label text-xs text-primary">Hire — CodeReport Global</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">I fix dev errors fast with AI.</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">You build, AI helps me ship. If you’re stuck on a bug, need a landing page in 24h, or want an automation — I’ll fix/build it, no fluff.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="gap-2"><Link href="#contact">Get help in 24h <Send className="h-4 w-4" /></Link></Button>
        <Button variant="outline" asChild><Link href="/archive">See guides</Link></Button>
      </div>
      <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />Avg reply 12h</span>
        <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />No lock-in</span>
        <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />18, AI-native</span>
      </div>
    </div></section>

    <section className="container py-12 md:py-16"><p className="font-label text-xs text-primary">Services</p><h2 className="mt-2 font-display text-3xl font-semibold">What I do</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-6"><h3 className="font-semibold">Bug / Error Fix</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">JetBrains ACP, npm/better-sqlite3, VS Code, build failures. Repro + fix + 2-min guide.</p><p className="mt-4 text-sm font-medium">$50–150 <span className="font-normal text-muted-foreground">· 24h</span></p><ul className="mt-4 space-y-1 text-sm text-muted-foreground"><li className="flex gap-2"><Check className="h-4 w-4 text-primary" />Repro + fix</li><li className="flex gap-2"><Check className="h-4 w-4 text-primary" />Commands + output</li></ul></div>
        <div className="rounded-2xl border border-border bg-white p-6"><h3 className="font-semibold">AI Landing / Portfolio</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">One-page site in 24h, AI-built, copy + design included.</p><p className="mt-4 text-sm font-medium">$150–300 <span className="font-normal text-muted-foreground">· 24h</span></p><ul className="mt-4 space-y-1 text-sm text-muted-foreground"><li className="flex gap-2"><Check className="h-4 w-4 text-primary" />Copy + design</li><li className="flex gap-2"><Check className="h-4 w-4 text-primary" />Deploy included</li></ul></div>
        <div className="rounded-2xl border border-border bg-white p-6"><h3 className="font-semibold">Automation</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Scrape, bot, n8n — repetitive work → one click.</p><p className="mt-4 text-sm font-medium">$100–200 <span className="font-normal text-muted-foreground">· 2–3 days</span></p><ul className="mt-4 space-y-1 text-sm text-muted-foreground"><li className="flex gap-2"><Check className="h-4 w-4 text-primary" />One-click run</li><li className="flex gap-2"><Check className="h-4 w-4 text-primary" />Docs included</li></ul></div>
      </div>
    </section>

    <section className="container py-12 md:py-16"><div className="rounded-2xl border border-[#d6e2d1] bg-[#f5f9f3] p-6 md:p-8"><p className="font-label text-xs text-primary">Portfolio</p><h3 className="mt-2 font-display text-2xl font-semibold">3 AI-built demos</h3><p className="mt-2 text-sm text-muted-foreground">Real builds — not mockups. Click to see live.</p><div className="mt-6 grid gap-4 md:grid-cols-3"><a href="/" className="rounded-xl border border-border bg-white p-4 hover:shadow-sm"><p className="text-sm font-medium">Fix Guide: npm12 better-sqlite3</p><p className="mt-1 text-xs text-muted-foreground">Guide + distribution system live</p></a><a href="/hire" className="rounded-xl border border-border bg-white p-4 hover:shadow-sm"><p className="text-sm font-medium">Landing: AI Portfolio</p><p className="mt-1 text-xs text-muted-foreground">Demo — 24h build</p></a><a href="https://github.com/adittaya/codereportglobal" target="_blank" className="rounded-xl border border-border bg-white p-4 hover:shadow-sm"><p className="text-sm font-medium">Automation: Content → 5 channels</p><p className="mt-1 text-xs text-muted-foreground">Distribution engine</p></a></div></div></section>

    <section id="contact" className="container py-12 md:py-16"><p className="font-label text-xs text-primary">Contact</p><h2 className="mt-2 font-display text-3xl font-semibold">Tell me what you need</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">Reply within 12h. Or reach directly: <a href="mailto:adityazyrogami@gmail.com" className="text-primary underline">adityazyrogami@gmail.com</a> (primary) · <a href="mailto:editor@codereportglobal.com" className="text-primary underline">editor@codereportglobal.com</a> · WhatsApp on request.</p>
      <form onSubmit={e => { e.preventDefault(); submit(); }} className="mt-8 grid gap-3 rounded-2xl border border-border bg-white p-6 md:max-w-2xl">
        <div className="grid gap-3 sm:grid-cols-2"><Input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /><Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" /></div>
        <Textarea required value={need} onChange={e => setNeed(e.target.value)} placeholder="What do you need? e.g. Fix npm 12 better-sqlite3 error, or build a landing page for my SaaS" rows={4} />
        <div className="flex items-center gap-3"><Button type="submit" disabled={submitting} className="gap-2">{submitting ? "Sending…" : "Send"} <Send className="h-4 w-4" /></Button><span className="text-xs text-muted-foreground">By sending, you agree to our <Link href="/privacy" className="text-primary underline">Privacy</Link>.</span></div>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">Direct: <a href="mailto:adityazyrogami@gmail.com" className="text-primary underline">adityazyrogami@gmail.com</a> (primary) · <a href="mailto:editor@codereportglobal.com" className="text-primary underline">editor@codereportglobal.com</a> · WhatsApp on request.</p>
      <div className="mt-8 flex gap-6 text-sm"><a href="https://www.reddit.com/" target="_blank" className="inline-flex items-center gap-2 text-primary hover:underline"><MessageCircle className="h-4 w-4" />Reddit DM</a><a href="https://x.com/" target="_blank" className="inline-flex items-center gap-2 text-primary hover:underline"><MessageCircle className="h-4 w-4" />X DM</a></div>
    </section>
  </>;
}
