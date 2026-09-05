"use client";

import { popularPosts } from "@/lib/data";
import { useState } from "react";

export default function PopularSection() {
  const [slide, setSlide] = useState(0);
  const groups = [
    popularPosts.slice(0, 5),
    popularPosts.slice(0, 5),
  ];

  return (
    <div style={{ padding: "0 15px" }}>
      <h3 className="widget-title">Popular</h3>
      {groups[slide]?.map((post, idx) => (
        <div key={post.id} style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "15px", paddingBottom: "15px", borderBottom: "1px dashed #DCDEDF" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            border: "3px solid #e7e8e9",
            borderRadius: "50%",
            width: "42px",
            height: "42px",
            minWidth: "42px",
          }}>
            <span style={{ fontSize: "24px", fontWeight: 700, color: "#17222b" }}>{idx + 1}</span>
          </div>
          <div className="post_img" style={{ flex: "0 0 80px", borderRadius: "5px", overflow: "hidden" }}>
            <a href="#">
              <img src={post.image} alt={post.title} style={{ width: "80px", height: "70px", objectFit: "cover", borderRadius: "5px" }} />
            </a>
          </div>
          <div className="single_post_text" style={{ flex: 1 }}>
            <div className="meta" style={{ marginBottom: "3px" }}>
              <a className="cat" href="#" style={{ fontSize: "11px" }}>{post.category}</a>
              <a className="date" href="#" style={{ fontSize: "12px" }}>{post.date}</a>
            </div>
            <h4 style={{ fontSize: "14px", lineHeight: 1.4, margin: 0 }}>
              <a href="#">{post.title}</a>
            </h4>
          </div>
        </div>
      ))}
      <div className="owl-dots">
        {groups.map((_, idx) => (
          <div
            key={idx}
            className={`owl-dot ${slide === idx ? "active" : ""}`}
            onClick={() => setSlide(idx)}
          />
        ))}
      </div>
    </div>
  );
}
