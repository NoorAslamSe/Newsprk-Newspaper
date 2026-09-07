"use client";

import { Loader2 } from "lucide-react";
import React from "react";

interface Props {
  isLoading: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
}

export default function LoadMoreButton({ isLoading, onClick, label = "Show More", className = "" }: Props) {
  return (
    <div className={`mt-8 flex justify-center w-full ${className}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className={`is-btn relative inline-flex items-center justify-center font-bold px-8 py-3.5 rounded-[var(--round-5)] overflow-hidden transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed`}
        style={{
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          backgroundColor: "var(--g-color)",
          color: "#ffffff",
        }}
      >
        <span className={`inline-flex items-center gap-2 transition-transform duration-300 ${isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
          {label}
        </span>
        
        {/* Spinner Overlay */}
        <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isLoading ? "opacity-100" : "opacity-0"}`}>
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </span>
      </button>
    </div>
  );
}
