export default function Newsletter() {
  return (
    <section className="newsletter">
      <div className="container">
        <h3>Newsletter</h3>
        <p>
          Subscribe to our newsletter and never miss an update. We hate spam as much as you do.
        </p>
        <form>
          <input type="email" placeholder="Enter your email address..." />
          <button type="button">Subscribe</button>
        </form>
      </div>
    </section>
  );
}
