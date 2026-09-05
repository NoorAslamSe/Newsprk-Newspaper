import { sliderPosts } from "@/lib/data";

export default function PostSlider() {
  const visible = sliderPosts.slice(0, 3);
  return (
    <section className="section-padding" style={{ padding: "0" }}>
      <div className="container" style={{ paddingTop: "40px" }}>
        <div className="post__slider__style__1" style={{ display: "flex", gap: "20px" }}>
          {visible.map((post) => (
            <div key={post.id} className="single_post widgets_small post_type5" style={{ flex: "1 1 0" }}>
              <div className="post_img">
                <a href="#">
                  <img alt={post.title} src={post.image} />
                </a>
              </div>
              <div className="single_post_text">
                <h4>
                  <a href="#">{post.title}</a>
                </h4>
                <p>{post.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
