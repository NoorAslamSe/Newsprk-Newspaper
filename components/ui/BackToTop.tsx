"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShow(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!show) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed z-[1001] flex items-center justify-center transition-opacity"
      style={{
        bottom: "20px",
        right: "20px",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#eb0254",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <i className="fas fa-chevron-up" style={{ fontSize: "14px" }} />
    </button>
  );
}
