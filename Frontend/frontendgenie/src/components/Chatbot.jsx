import { useState } from "react";

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://models.github.ai/inference/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.REACT_APP_GITHUB_TOKEN}`, // 🔑 keep token safe in .env
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

  return (
    <div className="chatbot-container">
      {/* Floating Button */}
      {!isOpen && (
        <button className="chat-toggle" onClick={() => setIsOpen(true)}>
          💬 Chat with AI
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span>JourneyGenie AI Assistant</span>
            <button className="close-btn" onClick={() => setIsOpen(false)}>✖</button>
          </div>

          <div className="chat-box">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && <div className="message assistant">Typing...</div>}
          </div>

          <div className="input-box">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .chatbot-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        .chat-toggle {
          background: #1e88e5;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 10px 15px;
          cursor: pointer;
          font-size: 14px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        .chat-toggle:hover {
          background: #1565c0;
        }

        .chat-window {
          width: 350px;
          height: 520px;
          background: #121212;
          color: #eee;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }

        .chat-header {
          background: #1e88e5;
          padding: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: bold;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
        }

        .chat-box {
          flex: 1;
          padding: 10px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .message {
          padding: 8px 12px;
          border-radius: 6px;
          max-width: 75%;
          word-wrap: break-word;
        }
        .user {
          align-self: flex-end;
          background: #1e88e5;
          color: white;
        }
        .assistant {
          align-self: flex-start;
          background: #333;
        }

        .input-box {
          display: flex;
          padding: 8px;
          border-top: 1px solid #333;
          background: #1a1a1a;
        }

        .input-box input {
          flex: 1;
          padding: 8px;
          background: #222;
          color: #eee;
          border: none;
          outline: none;
          border-radius: 4px;
        }

        .input-box button {
          margin-left: 6px;
          background: #1e88e5;
          border: none;
          color: #fff;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .input-box button:hover {
          background: #1565c0;
        }
      `}</style>
    </div>
  );
}
