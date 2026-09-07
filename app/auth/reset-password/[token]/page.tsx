"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { executePasswordResetAction } from "@/lib/actions/authReset";
import { toast } from "sonner";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useParams<{ token?: string }>();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = params?.token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Missing recovery token.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");

    setIsSubmitting(true);
    const res = await executePasswordResetAction(token, password);
    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      toast.success(res.message);
    } else {
      toast.error(res.error || "Failed to reset password.");
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 font-bold">Invalid Reset Request. No token provided.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-black relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center justify-center p-4">
        
        {/* Main Card */}
        <div className="w-full max-w-md bg-white/80 dark:bg-gray-900/60 backdrop-blur-3xl border border-gray-200 dark:border-gray-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-400" />

          {!isSuccess ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-500 rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(34,197,94,0.4)] mb-2">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">New Password</h1>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Create a strong new password for your account. Ensure it is unique.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs uppercase font-bold tracking-wider text-gray-500">New Password</Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-14 bg-gray-50 dark:bg-black/50 border-gray-200 dark:border-gray-800 focus-visible:ring-green-500 focus-visible:border-green-500 tracking-wider shadow-inner pl-12 transition-all"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-xs uppercase font-bold tracking-wider text-gray-500">Confirm Password</Label>
                  <div className="relative group">
                    <Input
                      id="confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-14 bg-gray-50 dark:bg-black/50 border-gray-200 dark:border-gray-800 focus-visible:ring-green-500 focus-visible:border-green-500 tracking-wider shadow-inner pl-12 transition-all"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={!password || !confirmPassword || isSubmitting}
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Save & Unlock <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500 text-center space-y-6">
               <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                 <ShieldCheck className="w-10 h-10 text-green-500" />
               </div>
               <h2 className="text-2xl font-black text-black dark:text-white">Secured</h2>
               <p className="text-muted-foreground text-sm">
                 Your password has been successfully reset. You can now use your new credentials to access the platform.
               </p>

               <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <Link href="/auth/signin">
                  <Button className="w-full h-12 font-bold bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black">
                    Proceed to Login
                  </Button>
                </Link>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
