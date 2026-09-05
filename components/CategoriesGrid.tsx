import { categories } from "@/lib/data";

export default function CategoriesGrid() {
  return (
    <section className="section-padding" style={{ background: "#fff" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <h3 className="widget-title" style={{ border: 0, margin: 0, padding: 0 }}>Categories</h3>
          <a href="#" className="see-all">See all</a>
        </div>
        <div className="category_list">
          {categories.map((cat) => (
            <a key={cat.name} href="#" className="category_card">
              <img src={cat.image} alt={cat.name} />
              <div className="overlay">
                <span>{cat.name}</span>
                <i className="fas fa-arrow-right" style={{ fontSize: "14px" }}></i>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
