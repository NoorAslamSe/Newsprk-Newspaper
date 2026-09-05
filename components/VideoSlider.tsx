"use client";

import { videoPosts } from "@/lib/data";
import { useState } from "react";

export default function VideoSlider() {
  const [page, setPage] = useState(0);
  const perPage = 2;
  const totalPages = Math.ceil(videoPosts.length / perPage);
  const currentPosts = videoPosts.slice(page * perPage, (page + 1) * perPage);

  return (
    <section style={{ padding: "50px 0", background: "#f8f8f8" }}>
      <div style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {currentPosts.map((post) => (
              <div key={post.id} style={{ position: "relative", borderRadius: "5px", overflow: "hidden" }}>
                <img
                  src={post.image}
                  alt={post.title}
                  style={{ width: "100%", height: "250px", objectFit: "cover", borderRadius: "5px" }}
                />
                {post.hasVideo && (
                  <span className="tranding">
                    <i className="fas fa-play"></i>
                  </span>
                )}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "20px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  borderRadius: "0 0 5px 5px",
                }}>
                  <div className="meta" style={{ marginBottom: "5px" }}>
                    <a className="cat" href="#" style={{ color: "#1091ff", textTransform: "uppercase", letterSpacing: "1px", fontSize: "12px", fontWeight: 600 }}>
                      {post.category}
                    </a>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>{post.date}</span>
                  </div>
                  <h4 style={{ margin: 0 }}>
                    <a href="#" style={{ color: "#fff", fontSize: "15px" }}>{post.title}</a>
                  </h4>
                </div>
              </div>
            ))}
          </div>
          <div className="owl-dots" style={{ marginTop: "15px" }}>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <div
                key={idx}
                className={`owl-dot ${page === idx ? "active" : ""}`}
                onClick={() => setPage(idx)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
