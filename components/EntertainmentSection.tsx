import { entertainmentPosts } from "@/lib/data";

export default function EntertainmentSection() {
  return (
    <section className="section-padding" style={{ background: "#fff" }}>
      <div className="container">
        <div className="row">
          {/* Left: Entertainment Posts */}
          <div style={{ flex: "0 0 50%", maxWidth: "50%", padding: "0 15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h3 className="widget-title" style={{ border: 0, margin: 0, padding: 0 }}>Entertainment</h3>
              <a href="#" className="see-all">See all</a>
            </div>
            {entertainmentPosts.map((post) => (
              <div key={post.id} className="post_type12" style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                <div className="post_img" style={{ flex: "0 0 42%", borderRadius: "5px", overflow: "hidden", position: "relative" }}>
                  <a href="#">
                    <img src={post.image} alt={post.title} style={{ width: "100%", height: "150px", objectFit: "cover" }} />
                  </a>
                  {post.hasVideo && (
                    <span className="tranding" style={{ width: "40px", height: "40px", fontSize: "14px" }}>
                      <i className="fas fa-play"></i>
                    </span>
                  )}
                </div>
                <div className="single_post_text" style={{ flex: 1 }}>
                  <div className="meta" style={{ marginBottom: "5px" }}>
                    <a className="cat" href="#" style={{ color: "#1091ff", textTransform: "uppercase", letterSpacing: "1px", fontSize: "12px", fontWeight: 600 }}>
                      {post.category}
                    </a>
                    <a className="date" href="#" style={{ color: "#888e92", fontSize: "13px" }}>
                      {post.date}
                    </a>
                  </div>
                  <h4 style={{ fontSize: "16px", lineHeight: 1.4, marginBottom: "5px" }}>
                    <a href="#">{post.title}</a>
                  </h4>
                  <p style={{ fontSize: "14px", color: "#747a80", lineHeight: 1.5, marginBottom: "8px" }}>
                    {post.excerpt}
                  </p>
                  <a href="#" style={{ fontSize: "13px", color: "#1091ff", fontWeight: 600 }}>Read more</a>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Slider Post with Numbers */}
          <div style={{ flex: "0 0 50%", maxWidth: "50%", padding: "0 15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h3 className="widget-title" style={{ border: 0, margin: 0, padding: 0 }}>Slider Post</h3>
              <a href="#" className="see-all">See all</a>
            </div>
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px dashed #DCDEDF" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                  border: "3px solid #e7e8e9",
                  borderRadius: "50%",
                  width: "48px",
                  height: "48px",
                  minWidth: "48px",
                }}>
                  <span style={{ fontSize: "24px", fontWeight: 700, color: "#17222b" }}>{idx + 1}</span>
                </div>
                <div className="single_post_text" style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "14px", lineHeight: 1.4, margin: 0, fontWeight: 400 }}>
                    <a href="#">Bobby Brown Autopsy Reveals He Died From Alcohol</a>
                  </h4>
                  <div className="meta" style={{ marginTop: "4px" }}>
                    <a className="cat" href="#" style={{ fontSize: "11px" }}>Sports</a>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                  <a href="#" style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "#3b5998", color: "#fff", borderRadius: "3px", fontSize: "12px" }}>
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "#bd081c", color: "#fff", borderRadius: "3px", fontSize: "12px" }}>
                    <i className="fab fa-pinterest-p"></i>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
