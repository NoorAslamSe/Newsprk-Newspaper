"use client";

import { galleryPosts } from "@/lib/data";
import { useState } from "react";

export default function GallerySlider() {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div className="post_gallary_area">
      <div className="row">
        <div className="col-12">
          {/* Main slider */}
          <div style={{ position: "relative", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{ position: "relative" }}>
              <img
                src={galleryPosts[activeSlide]?.image}
                alt={galleryPosts[activeSlide]?.title}
                style={{ width: "100%", height: "350px", objectFit: "cover", borderRadius: "5px" }}
              />
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "25px",
                background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                color: "#fff",
              }}>
                <div className="meta meta_separator1" style={{ marginBottom: "8px" }}>
                  <a className="cat" href="#" style={{ color: "#1091ff", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, borderRight: "2px solid #fff", paddingRight: "12px" }}>
                    {galleryPosts[activeSlide]?.category}
                  </a>
                  <a className="date" href="#" style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                    {galleryPosts[activeSlide]?.date}
                  </a>
                </div>
                <h4 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  <a href="#" style={{ color: "#fff" }}>{galleryPosts[activeSlide]?.title}</a>
                </h4>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginTop: "8px" }}>
                  {galleryPosts[activeSlide]?.excerpt}
                </p>
              </div>
            </div>
          </div>

          {/* Thumbnail nav */}
          <div style={{ display: "flex", gap: "8px", marginTop: "10px", overflow: "hidden" }}>
            {galleryPosts.slice(0, 5).map((post, idx) => (
              <div
                key={post.id}
                onClick={() => setActiveSlide(idx)}
                style={{
                  flex: "0 0 calc(20% - 7px)",
                  cursor: "pointer",
                  borderRadius: "4px",
                  overflow: "hidden",
                  border: activeSlide === idx ? "2px solid #1091ff" : "2px solid transparent",
                  transition: "border-color 0.3s",
                }}
              >
                <img
                  src={post.image}
                  alt={post.title}
                  style={{ width: "100%", height: "70px", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
