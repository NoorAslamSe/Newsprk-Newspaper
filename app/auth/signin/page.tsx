"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import BrandIcon from "@/components/ui/icons/BrandIcon";

function SignInForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (!res || res.error) {
      setError("Invalid email or password.");
      return;
    }
    window.location.href = res.url ?? callbackUrl;
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-black dark:text-white">
          Welcome back
        </h1>
        <p className="text-muted-foreground mt-2">
          Securely access the Trendsposts platform.
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-4">
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-black dark:text-gray-300 font-bold uppercase text-[10px] tracking-wider">Email Address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@Trendsposts.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-gray-50/50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus-visible:ring-red-600 focus-visible:border-red-600 transition-all shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-black dark:text-gray-300 font-bold uppercase text-[10px] tracking-wider">Password</Label>
              <Link href="/auth/forgot-password" className="text-[10px] text-gray-500 hover:text-red-600 font-medium">Forgot password?</Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 bg-gray-50/50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus-visible:ring-red-600 focus-visible:border-red-600 transition-all shadow-sm"
            />
          </div>
        </div>

        {error ? (
          <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-md text-sm font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        ) : null}

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-base shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Sign into Dashboard <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t border-gray-100 dark:border-gray-800">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <span>Protected by advanced cryptographic security</span>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-black">
      {/* Left side visual */}
      <div className="relative hidden w-0 flex-1 lg:block overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-black to-green-900/20 z-0"></div>
        {/* Dynamic decorative shapes */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="absolute inset-0 z-10 flex flex-col justify-center px-16 lg:px-24">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]">
               <Link href="/" className="flex items-center gap-2.5 shrink-0">
                 <BrandIcon className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
               </Link>
            </div>
            <span
              className="font-black text-3xl tracking-tight"
              style={{ color: "var(--g-color)", letterSpacing: "-0.03em" }}
            >
              Trends<span style={{ color: "var(--heading-color)" }}>Posts</span>
            </span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter leading-tight max-w-xl">
            The next generation<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">media engine</span> for your brand.
          </h2>
          <p className="mt-6 text-lg text-gray-400 max-w-lg font-medium">
            Manage your blogs and assets, run your ads on fast CDN networks, and secure your automated API protocols with zero friction.
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 border-l border-gray-100 dark:border-gray-800">
        <div className="mx-auto w-full max-w-sm lg:w-96 flex flex-col justify-center h-full">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-12 lg:hidden">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className="text-2xl font-black text-black tracking-tight">Trendsposts</span>
          </div>

          <Suspense fallback={<div>Loading form...</div>}>
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
