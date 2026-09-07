"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/hooks/useTranslations";

export default function NewsletterWidget() {
    const tNews = useTranslations("newsletter");
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        
        setIsLoading(true);
        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const result = await res.json();
            
            if (res.ok && result.success) {
                setSubmitted(true);
                toast.success(result.message);
            } else {
                toast.error(result.error || tNews("failedToSubscribe"));
            }
        } catch (err) {
            toast.error(tNews("unexpectedError"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="relative overflow-hidden rounded-[var(--round-7)] p-6 text-center"
            style={{
                background: "linear-gradient(135deg, #ff184e 0%, #ff557a 100%)",
            }}
        >
            {/* decorative circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

            <div className="relative z-10">
                <p className="text-white/80 text-xs uppercase tracking-widest mb-1" style={{ fontWeight: 600 }}>
                    {tNews("title")}
                </p>
                <h3 className="text-white text-xl mb-2" style={{ fontWeight: 700 }}>
                    {tNews("stayInTheLoop")}
                </h3>
                <p className="text-white/80 text-sm mb-5">
                    {tNews("newsletterDescription")}
                </p>
                {submitted ? (
                    <div className="py-3 px-4 rounded-[var(--round-5)] bg-white/20 text-white font-semibold text-sm">
                        ✓ {tNews("youSubscribed")}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={tNews("emailPlaceholder")}
                            required
                            className="w-full px-4 py-3 rounded-[var(--round-5)] text-sm text-gray-800 outline-none border-none bg-white placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-[var(--round-5)] bg-[#191c20] text-white text-sm font-bold hover:bg-black transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {isLoading ? (
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : null}
                            {isLoading ? tNews("subscribing") : tNews("subscribeNow")}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
