import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return <section className="container flex min-h-[60vh] max-w-4xl flex-col items-center justify-center py-24 text-center"><div className="grid h-16 w-16 place-items-center rounded-full bg-secondary"><ArrowLeft className="h-7 w-7 text-primary" /></div><h1 className="mt-6 font-display text-6xl font-semibold tracking-tight">404</h1><h2 className="mt-3 font-display text-2xl font-semibold">This page could not be found</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">The page you are looking for may have moved, been retired, or never existed.</p><Link href="/" className="mt-8"><Button>Return to the journal</Button></Link></section>;
}
