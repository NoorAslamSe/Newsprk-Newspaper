"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, UserPlus } from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();

  const { data: session, status } = useSession();
  
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/users/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const body: unknown = await res.json().catch(() => null);
      const message =
        typeof body === "object" && body && "error" in body
          ? String((body as { error: unknown }).error)
          : "Unable to accept invitation.";
      setError(message);
      return;
    }
    setDone(true);
  }

  // If already logged in, we should warn them
  const isAlreadyLoggedIn = status === "authenticated";

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-white/5 bg-background/60 backdrop-blur-xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-primary/10 flex items-center justify-center rounded-xl mb-2 border border-primary/20">
             {done ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <UserPlus className="w-6 h-6 text-primary" />}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
             {done ? "Welcome to Trendsposts!" : "Complete Profile"}
          </CardTitle>
          <CardDescription className="text-sm">
             {done 
               ? "Your account has been fully activated." 
               : "Set up your credentials to join the Trendsposts dashboard workspace."}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {done ? (
            <div className="grid gap-6 animate-in zoom-in-95 duration-500">
              <Button asChild className="w-full font-semibold shadow-lg hover:shadow-xl transition-all h-11" size="lg">
                <Link href="/auth/signin">Continue to Sign In</Link>
              </Button>
            </div>
          ) : isAlreadyLoggedIn ? (
            <div className="grid gap-6 animate-in fade-in duration-500 text-center">
              <div className="p-4 bg-muted/50 rounded-xl border border-white/5 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  You are currently signed in as <span className="text-foreground font-bold">{session?.user?.email}</span>
                </p>
                <p className="text-xs text-muted-foreground italic">
                  To accept this invitation and create a new account, please sign out first.
                </p>
              </div>
              <Button 
                variant="destructive" 
                className="w-full h-11 font-bold shadow-lg"
                onClick={() => signOut({ callbackUrl: window.location.href })}
              >
                Sign Out to Continue
              </Button>
              <Button asChild variant="ghost" className="w-full h-11 font-bold text-muted-foreground">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          ) : (
            <form className="grid gap-5 animate-in fade-in duration-500" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-11 bg-background/50"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Secure Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters..."
                  className={twMerge("h-11 bg-background/50", password && password.length < 8 ? "border-destructive focus-visible:ring-destructive" : "")}
                  required
                  minLength={8}
                />
              </div>
              {error ? (
                <div className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">{error}</div>
              ) : null}
              <Button type="submit" disabled={loading || password.length < 8} className="w-full mt-2 h-11 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]">
                {loading ? "Activating..." : "Accept Invitation"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
