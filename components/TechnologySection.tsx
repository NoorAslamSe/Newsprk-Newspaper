"use client";

import { technologyPosts, technologyListPosts, socialCounters, mostViewPosts } from "@/lib/data";
import { useState, useEffect } from "react";

export default function TechnologySection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mostViewSlide, setMostViewSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % technologyPosts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const mostViewGroups = [
    mostViewPosts.slice(0, 4),
    mostViewPosts.slice(4, 8),
  ];

  return (
    <section className="section-padding" style={{ background: "#fff" }}>
      <div className="container">
        <div className="row">
          {/* Left: Technology */}
          <div style={{ flex: "0 0 50%", maxWidth: "50%", padding: "0 15px" }}>
            <h3 className="widget-title">Technology</h3>
            <div style={{ position: "relative", borderRadius: "5px", overflow: "hidden", marginBottom: "25px" }}>
              <img
                src={technologyPosts[currentSlide]?.image}
                alt={technologyPosts[currentSlide]?.title}
                style={{ width: "100%", height: "280px", objectFit: "cover" }}
              />
              {technologyPosts[currentSlide]?.hasVideo && (
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
              }}>
                <div className="meta" style={{ marginBottom: "5px" }}>
                  <a className="cat" href="#" style={{ color: "#1091ff", textTransform: "uppercase", letterSpacing: "1px", fontSize: "12px", fontWeight: 600 }}>
                    {technologyPosts[currentSlide]?.category}
                  </a>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
                    {technologyPosts[currentSlide]?.date}
                  </span>
                </div>
                <h4 style={{ margin: 0 }}>
                  <a href="#" style={{ color: "#fff", fontSize: "16px" }}>
                    {technologyPosts[currentSlide]?.title}
                  </a>
                </h4>
              </div>
            </div>

            {/* Technology list posts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              {technologyListPosts.map((post) => (
                <div key={post.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div className="post_img" style={{ flex: "0 0 80px", borderRadius: "5px", overflow: "hidden" }}>
                    <a href="#">
                      <img src={post.image} alt={post.title} style={{ width: "80px", height: "70px", objectFit: "cover" }} />
                    </a>
                  </div>
                  <div className="single_post_text" style={{ flex: 1 }}>
                    <div className="meta" style={{ marginBottom: "3px" }}>
                      <a className="cat" href="#" style={{ fontSize: "11px" }}>
                        <i className="fas fa-bolt" style={{ marginRight: "3px", fontSize: "10px" }}></i>
                        {post.category}
                      </a>
                    </div>
                    <h4 style={{ fontSize: "14px", lineHeight: 1.4, margin: 0 }}>
                      <a href="#">{post.title}</a>
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Social Counter + Most View */}
          <div style={{ flex: "0 0 50%", maxWidth: "50%", padding: "0 15px" }}>
            {/* Social Counter */}
            <div style={{ marginBottom: "30px" }}>
              <h3 className="widget-title">Follow Us</h3>
              <div className="social_counter">
                <ul>
                  {socialCounters.map((sc) => (
                    <li key={sc.platform}>
                      <a href="#" className={sc.bgClass}>
                        <i className={sc.icon}></i>
                        <span>{sc.platform}</span>
                        <span className="count">{sc.count} {sc.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Most View */}
            <div>
              <h3 className="widget-title">Most View</h3>
              <div style={{ position: "relative" }}>
                {mostViewGroups[mostViewSlide]?.map((post, idx) => (
                  <div key={post.id} className="single_post" style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "15px" }}>
                    <div className="post_img number" style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fff",
                      border: "3px solid #e7e8e9",
                      borderRadius: "50%",
                      width: "48px",
                      height: "48px",
                      minWidth: "48px",
                      position: "relative",
                    }}>
                      <h2 style={{ fontSize: "28px", lineHeight: "28px", color: "#17222b", margin: 0 }}>{idx + 1 + mostViewSlide * 4}</h2>
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
              </div>
              <div className="owl-dots" style={{ justifyContent: "flex-end" }}>
                {mostViewGroups.map((_, idx) => (
                  <div
                    key={idx}
                    className={`owl-dot ${mostViewSlide === idx ? "active" : ""}`}
                    onClick={() => setMostViewSlide(idx)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
