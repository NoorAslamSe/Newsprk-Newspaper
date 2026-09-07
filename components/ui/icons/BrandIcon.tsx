import React from "react";

export default function BrandIcon({ className = "shadow-[0_0_20px_rgba(220,38,38,0.5)]" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" rx="24" fill="#EF4444" />
      <path 
        d="M52 18L22 55h26l-4 27L78 43H52l4-25z" 
        fill="#FFFFFF" 
        stroke="#FFFFFF" 
        strokeWidth="6" 
        strokeLinejoin="round" 
        strokeLinecap="round"
      />
    </svg>
  );
}
