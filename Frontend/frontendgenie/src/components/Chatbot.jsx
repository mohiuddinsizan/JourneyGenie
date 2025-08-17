import { useState } from "react";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const token = import.meta.env.REACT_APP_GITHUB_TOKEN;
const apiUrl = import.meta.env.REACT_APP_API_URL;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

const client = ModelClient(endpoint, new AzureKeyCredential(token));

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful chatbot." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await client.path("/chat/completions").post({
        body: {
          messages: newMessages.map(({ role, content }) => ({ role, content })),
          temperature: 0.7,
          top_p: 1,
          model,
        },
      });

      if (isUnexpected(response)) throw response.body.error;

      const botReply = response.body.choices[0].message.content;
      setMessages([...newMessages, { role: "assistant", content: botReply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([...newMessages, { role: "assistant", content: "⚠️ Error: Failed to get response." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages
          .filter((m) => m.role !== "system")
          .map((m, i) => (
            <div
              key={i}
              className={`message ${m.role === "user" ? "user" : "bot"}`}
            >
              {m.content}
            </div>
          ))}
        {loading && <div className="message bot">Typing...</div>}
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

      <style jsx>{`
        .chat-container {
          background: #121212;
          color: #eee;
          display: flex;
          flex-direction: column;
          width: 400px;
          height: 500px;
          border-radius: 10px;
          border: 1px solid #333;
          overflow: hidden;
          font-family: sans-serif;
        }
        .chat-box {
          flex: 1;
          padding: 10px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .message {
          padding: 8px 12px;
          border-radius: 8px;
          max-width: 75%;
          word-wrap: break-word;
        }
        .user {
          background: #1e88e5;
          align-self: flex-end;
        }
        .bot {
          background: #333;
          align-self: flex-start;
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
          margin-left: 8px;
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
