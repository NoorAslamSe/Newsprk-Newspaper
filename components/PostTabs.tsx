"use client";

import { useState } from "react";
import { latestPosts, popularPosts, trendingTabPosts } from "@/lib/data";

const tabs = [
  { label: "Latest post", data: latestPosts },
  { label: "Popular", data: popularPosts },
  { label: "Trending", data: trendingTabPosts },
];

export default function PostTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="nav-tabs">
        {tabs.map((tab, idx) => (
          <div
            key={idx}
            className={`nav-item ${activeTab === idx ? "active" : ""}`}
            onClick={() => setActiveTab(idx)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className="tab-content">
        {tabs.map((tab, idx) => (
          <div key={idx} className={`tab-pane ${activeTab === idx ? "active" : ""}`}>
            {tab.data.map((post) => (
              <div key={post.id} className="single_post" style={{ display: "flex", gap: "15px", marginBottom: "15px", alignItems: "flex-start" }}>
                <div className="post_img" style={{ flex: "0 0 80px" }}>
                  <a href="#">
                    <img
                      src={post.image}
                      alt={post.title}
                      style={{ width: "80px", height: "70px", objectFit: "cover", borderRadius: "5px" }}
                    />
                  </a>
                </div>
                <div className="single_post_text" style={{ flex: 1 }}>
                  <div className="meta" style={{ marginBottom: "4px" }}>
                    <a className="cat" href="#" style={{ textTransform: "uppercase", letterSpacing: "1px", fontSize: "12px", color: "#1091ff", fontWeight: 600 }}>
                      {post.category}
                    </a>
                    <a className="date" href="#" style={{ color: "#888e92", fontSize: "13px" }}>
                      {post.date}
                    </a>
                  </div>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.4, margin: 0 }}>
                    <a href="#" style={{ color: "#17222b" }}>{post.title}</a>
                  </h4>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
