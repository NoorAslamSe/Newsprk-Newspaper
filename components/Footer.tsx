import Link from "next/link";
import { footerCategories1, footerCategories2, footerCategories3, footerCategories4 } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Top Section: Logo + Newsletter */}
        <div className="row" style={{ paddingBottom: "40px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ flex: "0 0 50%", maxWidth: "50%", padding: "0 15px" }}>
            <div className="cta">
              <div className="logo" style={{ maxWidth: "200px", marginBottom: "15px", filter: "brightness(0) invert(1)" }}>
                <img alt="Newsprk" src="/images/newsprk_dark.svg" />
              </div>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "15px" }}>
                Do am he horrible distance marriage so throughout. Afraid assure square so happenmr an before.
              </p>
              <div className="social2">
                <ul>
                  <li><a href="#"><i className="fab fa-facebook-f"></i></a></li>
                  <li><a href="#"><i className="fab fa-twitter"></i></a></li>
                  <li><a href="#"><i className="fab fa-youtube"></i></a></li>
                  <li><a href="#"><i className="fab fa-instagram"></i></a></li>
                </ul>
              </div>
            </div>
          </div>
          <div style={{ flex: "0 0 50%", maxWidth: "50%", padding: "0 15px" }}>
            <div className="cta">
              <h3 style={{ fontSize: "20px", marginBottom: "10px", color: "#fff" }}>Newsletter</h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "15px" }}>
                We hate spam as much as you do. Unsubscribe anytime.
              </p>
              <div className="newsletter-form">
                <input type="email" placeholder="email@example.com" />
                <button type="button">Sing Up</button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Links */}
        <div className="widget-section">
          <div className="row">
            <div style={{ flex: "0 0 25%", maxWidth: "25%", padding: "0 15px" }}>
              <div className="single_footer_nav">
                <ul>
                  {footerCategories1.map((cat, i) => (
                    <li key={i}><a href="#">{cat}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div style={{ flex: "0 0 25%", maxWidth: "25%", padding: "0 15px" }}>
              <div className="single_footer_nav">
                <ul>
                  {footerCategories2.map((cat, i) => (
                    <li key={i}><a href="#">{cat}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div style={{ flex: "0 0 25%", maxWidth: "25%", padding: "0 15px" }}>
              <div className="single_footer_nav">
                <ul>
                  {footerCategories3.map((cat, i) => (
                    <li key={i}><a href="#">{cat}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div style={{ flex: "0 0 25%", maxWidth: "25%", padding: "0 15px" }}>
              <div className="single_footer_nav">
                <ul>
                  {footerCategories4.map((cat, i) => (
                    <li key={i}><a href="#">{cat}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="copyright">
        <div className="container">
          <p>Copyright &copy; 2026 All Right Reserved</p>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Advertise</a></li>
            <li><a href="#">Privacy & Policy</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
