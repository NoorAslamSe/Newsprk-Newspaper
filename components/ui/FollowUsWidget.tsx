"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Facebook, Twitter, Youtube, Instagram, Share2 } from "lucide-react";
import { getSocialSettingsAction } from "@/lib/actions/settings";
import { useTranslations } from "@/hooks/useTranslations";

export default function FollowUsWidget({ className = "" }: { className?: string }) {
    const tNews = useTranslations("newsletter");
    const [socials, setSocials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSocials() {
            const result = await getSocialSettingsAction();
            if (result.success) {
                setSocials(result.data);
            }
            setLoading(false);
        }
        fetchSocials();
    }, []);

    const getIcon = (network: string) => {
        switch (network.toLowerCase()) {
            case "facebook": return Facebook;
            case "twitter": return Twitter;
            case "youtube": return Youtube;
            case "instagram": return Instagram;
            default: return Share2;
        }
    };

    const getNetworkColor = (network: string) => {
        switch (network.toLowerCase()) {
            case "facebook": return "#1877F2";
            case "twitter": return "#000000";
            case "youtube": return "#FF0000";
            case "instagram": return "#E1306C";
            default: return "var(--g-color)";
        }
    };

    if (loading) {
        return (
            <div className={`widget-social animate-pulse ${className}`}>
                <div className="h-6 w-32 bg-[var(--flex-gray-15)] rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-[var(--flex-gray-7)] rounded-[var(--round-5)]"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`widget-social ${className}`}>
            <h3 className="section-heading-label font-bold text-lg mb-4 tracking-tight" style={{ color: "var(--heading-color)" }}>
                {tNews("stayConnected")}
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
                {socials.map((social) => {
                    const Icon = getIcon(social.network || social.name);
                    const bg = getNetworkColor(social.network || social.name);
                    
                    return (
                        <Link 
                            key={social.name} 
                            href={social.url || "#"}
                            className="group flex flex-col items-center justify-center text-center p-4 rounded-[var(--round-5)] transition-all overflow-hidden relative"
                            style={{ backgroundColor: bg, color: "#fff" }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center opacity-10 transition-transform duration-500 group-hover:scale-[1.8]">
                                <Icon className="w-20 h-20" />
                            </div>
                            
                            <div className="relative z-10 flex flex-col items-center gap-1 transition-transform duration-300 group-hover:-translate-y-1">
                                <Icon className="w-7 h-7 mb-1" />
                                <span className="font-bold text-lg leading-none tracking-tight">{social.count}</span>
                                <span className="text-[10px] uppercase font-semibold opacity-80 tracking-widest">{social.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
