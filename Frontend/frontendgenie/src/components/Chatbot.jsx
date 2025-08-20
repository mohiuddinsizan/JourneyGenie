import { useState } from "react";
import "./Chatbot.css";

export default function ChatBot() {
  const [heroInput, setHeroInput] = useState("");   
  const [showChat, setShowChat] = useState(false);  
  const [messages, setMessages] = useState([]);     
  const [chatInput, setChatInput] = useState("");   
  const [loading, setLoading] = useState(false);

  // API call reused for both heroInput and chatInput
  async function fetchReply(newMessages) {
    setLoading(true);
    try {
      const response = await fetch("https://models.github.ai/inference/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.REACT_APP_GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4.1",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            ...newMessages
          ]
        }),
      });

      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content || "⚠️ No reply";
      setMessages([...newMessages, { role: "assistant", content: botReply }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: "assistant", content: "⚠️ Error: Could not connect." }]);
    } finally {
      setLoading(false);
    }
  }

  // Open popup and send heroInput
  function openChat() {
    if (!heroInput.trim()) return;
    const firstMsg = { role: "user", content: heroInput };
    const newMessages = [firstMsg];
    setMessages(newMessages);
    setHeroInput("");
    setShowChat(true);

    // 🔥 fetch reply for the first question
    fetchReply(newMessages);
  }

  // Send inside popup
  function sendMessage() {
    if (!chatInput.trim()) return;
    const newMessages = [...messages, { role: "user", content: chatInput }];
    setMessages(newMessages);
    setChatInput("");
    fetchReply(newMessages);
  }

  return (
    <>
      {/* Hero white search bar */}
      <div className="hero-input">
        <input
          type="text"
          value={heroInput}
          onChange={(e) => setHeroInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && openChat()}
          placeholder="Ask me anything..."
        />
        <button onClick={openChat}>➤</button>
      </div>

      {/* Centered overlay with popup */}
      {showChat && (
        <div className="chat-overlay">
          <div className="chat-popup">
            <div className="chat-header">
              JourneyGenie Assistant
              <button onClick={() => setShowChat(false)} className="cross-btn" >✖</button>
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`message ${m.role}`}>
                  {m.content}
                </div>
              ))}
              {loading && <div className="message assistant">Typing...</div>}
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
