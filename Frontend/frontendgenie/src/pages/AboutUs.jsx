import './CommonPage.css';

export default function AboutUs() {
  return (
    <div className="fancy-page">
      <div className="glass-card">
      <h2 className="about-title">✨ About Us</h2>



        {/* Mission */}
        <section className="section">
          <p>
            Welcome to <strong>JourneyGenie</strong>, your AI-powered travel companion.  
            We believe traveling should be <span className="highlight">stress-free, fun, and inspiring</span>.  
            Our mission is to combine <span className="highlight">artificial intelligence</span> with a love for 
            adventure — making it effortless for you to discover destinations, plan trips, and save memories forever.
          </p>
        </section>

        {/* Features */}
        <section className="section">
          <h2 className="section-title">🚀 What We Offer</h2>
          <div className="features-grid">
            <div className="feature-card">🔮 Instant AI-powered travel suggestions</div>
            <div className="feature-card">🗺️ Detailed itineraries with hotels & transport</div>
            <div className="feature-card">📸 Save photos & generate memory videos</div>
            <div className="feature-card">🌍 Tailored recommendations for your style</div>
          </div>
        </section>

        {/* Vision */}
        <section className="section">
          <h2 className="section-title">🌈 Our Vision</h2>
          <p>
            Our vision is simple: <em>to make every journey unforgettable</em>,  
            whether it’s a weekend getaway or the adventure of a lifetime.  
          </p>
        </section>

        {/* Contact */}
        <section className="section">
          <h2 className="section-title">📬 Contact Us</h2>
          <p>Got questions, suggestions, or partnership ideas? We’d love to hear from you!</p>
          <div className="contact-grid">
            <div className="contact-card">
              📧 <strong>Email</strong><br />
              <a href="mailto:support@journeygenie.com">support@journeygenie.com</a>
            </div>
            <div className="contact-card">
              📱 <strong>Phone</strong><br />
              +1 (234) 567-890
            </div>
            <div className="contact-card">
              🏢 <strong>Office</strong><br />
              123 Explorer Lane, Adventure City, Wanderlust World
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="closing">
          <p>
            💖 Thank you for choosing <strong>JourneyGenie</strong>.  
            Let’s make your next trip truly magical ✨  
          </p>
        </section>
      </div>
    </div>
  );
}
