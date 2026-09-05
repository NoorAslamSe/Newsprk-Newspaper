"use client";

import { useState, useEffect } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`newsprk-er-back-to-top ${visible ? "visible" : ""}`}
      onClick={scrollToTop}
    >
      <p>Back to Top <i className="fal fa-long-arrow-right"></i></p>
    </div>
  );
}
