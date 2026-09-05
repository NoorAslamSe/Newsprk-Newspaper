import { featurePosts } from "@/lib/data";

export default function FeatureNews() {
  return (
    <section className="section-padding" style={{ background: "#fff" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <h3 className="widget-title" style={{ border: 0, margin: 0, padding: 0 }}>Feature News</h3>
          <a href="#" className="see-all">See all</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          {featurePosts.slice(0, 4).map((post) => (
            <div key={post.id} className="single_post">
              <div className="post_img">
                <a href="#">
                  <img src={post.image} alt={post.title} style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "5px" }} />
                </a>
              </div>
              <div className="single_post_text">
                <div className="meta">
                  <a className="cat" href="#">{post.category}</a>
                  <a className="date" href="#">{post.date}</a>
                </div>
                <h4 style={{ fontSize: "15px" }}>
                  <a href="#">{post.title}</a>
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
