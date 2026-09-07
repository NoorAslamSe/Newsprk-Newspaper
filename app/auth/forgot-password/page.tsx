"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, KeyRound, Loader2, ArrowLeft } from "lucide-react";
import { requestPasswordResetAction } from "@/lib/actions/authReset";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    const res = await requestPasswordResetAction(email);
    setIsSubmitting(false);

    if (res.success) {
      setIsSent(true);
      if (res.devLink) {
        setDevLink(res.devLink);
      }
    } else {
      toast.error(res.error || "System error processing request.");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-black relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center justify-center p-4">
        
        {/* Main Card */}
        <div className="w-full max-w-md bg-white/80 dark:bg-gray-900/60 backdrop-blur-3xl border border-gray-200 dark:border-gray-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400" />

          {!isSent ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(220,38,38,0.4)] mb-2">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">Account Recovery</h1>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Enter the email address associated with your Trendsposts dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase font-bold tracking-wider text-gray-500">Email Address</Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@Trendsposts.com"
                      required
                      className="h-14 bg-gray-50 dark:bg-black/50 border-gray-200 dark:border-gray-800 focus-visible:ring-red-600 focus-visible:border-red-600 tracking-wider shadow-inner pl-12 transition-all"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={!email.trim() || isSubmitting}
                  className="w-full h-14 bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-bold text-base shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Send Recovery Link <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8">
                <Link href="/auth/signin" className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500 text-center space-y-6">
               <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                 <Mail className="w-10 h-10 text-green-500" />
               </div>
               <h2 className="text-2xl font-black text-black dark:text-white">Check your email</h2>
               <p className="text-muted-foreground text-sm">
                 We have sent a secure recovery link to <span className="font-bold text-black dark:text-white">{email}</span>. Please click the link to reset your password.
               </p>

               {/* DEV ONLY LINK */}
               {devLink && (
                 <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-left">
                   <p className="text-xs text-red-600 font-bold mb-2">DEVELOPMENT MODE ONLY:</p>
                   <p className="text-xs text-gray-500 mb-2">Since you do not have SMTP configured, click this auto-generated link to proceed:</p>
                   <Link href={devLink} className="text-sm text-blue-600 hover:underline break-all font-mono block p-2 bg-white dark:bg-black rounded border border-gray-200 dark:border-gray-800">
                     {devLink}
                   </Link>
                 </div>
               )}

               <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <Link href="/auth/signin">
                  <Button variant="outline" className="w-full font-bold">Return to Sign In</Button>
                </Link>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
