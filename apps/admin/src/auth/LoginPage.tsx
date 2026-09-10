"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { setSessionToken } from "@/lib/api";
import { Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signIn = trpc.auth.signIn.useMutation({
    onSuccess: data => {
      // Persist the session JWT as well: static hosting talks cross-origin
      // and some browsers refuse the third-party cookie (see authFetch).
      if (data.sessionToken) setSessionToken(data.sessionToken);
      router.push("/studio");
    },
    onError: error => toast.error(error.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) return;
    signIn.mutate({ email: email.trim(), password });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#fbfcfa] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-label text-[10px] tracking-widest text-primary">SUNDARBAN YATRI</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">Publication studio</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with your publication account to manage content.</p>
        </div>
        <form onSubmit={submit} className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <Label htmlFor="login-email" className="text-xs text-muted-foreground">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="login-password" className="text-xs text-muted-foreground">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="mt-1.5"
              />
            </div>
            <Button type="submit" disabled={signIn.isPending || !email.trim() || !password} className="w-full">
              {signIn.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
