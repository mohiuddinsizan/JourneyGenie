import './CommonPage.css';

export default function HowItWorks() {
  return (
    <div className="fancy-page">
      <div className="glass-card">
        <h2>🚀 How It Works</h2>

        <p>
          JourneyGenie is designed to make your travels effortless and magical.  
          Here’s a step-by-step guide to using our platform:
        </p>

        <ol className="steps">
          <li>
            <strong>🔍 Ask our AI (Home Button)</strong> → Start by typing your question into the chatbot on the Home page.  
            Example: *“Where’s the best adventure trip right now?”*
          </li>

          <li>
            <strong>🧳 Plan your trip (Plan button)</strong> → Once you’re logged in, click <span className="highlight">Plan a Trip</span>.  
            Our AI will generate a detailed itinerary with hotels, transport, daily activities, and full expense estimates.
          </li>

          <li>
            <strong>👤 Save to Profile (Profile button)</strong> → All your trips and plans are stored in your <span className="highlight">Profile</span>.  
            You can return anytime to view, edit, or continue your journey.
          </li>


          <li>
            <strong>🎯 Track & Update</strong> → As you travel, update your journey, log expenses, and share your adventure.  
            Add photos directly to your profile.
          </li>

          <li>
            <strong>📸 Save Memories</strong> → Upload photos and let JourneyGenie automatically generate videos of your adventures,  
            creating beautiful souvenirs for your memories.
          </li>

          <li>
            <strong>✨ That’s it!</strong> → Everything is simple, magical, and ready to explore.  
            For a refresher on how the platform works, you can always revisit the <span className="highlight">How It Works</span> page.
          </li>

          <li>
            <strong>📖 Learn More (About Us button)</strong> → Want to know who we are and our mission? Just click <span className="highlight">About Us</span>.
          </li>

        </ol>

        <p className="closing">
          🚀 With just a few clicks, you can <em>ask, plan, save, and relive</em> your journeys.  
          JourneyGenie is your travel partner from start to finish!
        </p>
      </div>
    </div>
  );
}
