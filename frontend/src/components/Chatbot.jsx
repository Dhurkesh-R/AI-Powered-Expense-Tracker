import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { getBotReply } from "../services/api";

const Chatbot = ({ theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hey there! 👋 I'm FinMate, your personal finance buddy. Ask me about your spending, budgets, or savings!" },
  ]);
  const [input, setInput] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const messagesEndRef = useRef(null);

  const isGradient = theme === "gradient";

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isAILoading) return;

    const userMessageText = input;
    const userMessage = { sender: "user", text: userMessageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsAILoading(true);

    try {
        const botReply = await getBotReply(userMessageText);
        const botMessage = { sender: "bot", text: botReply };
        setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Connection error to AI service." },
      ]);
    } finally {
        setIsAILoading(false);
    }
  };

  // Dynamic Theme Classes
  const primaryColor = isGradient ? "from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800" : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800";
  const userBubbleColor = isGradient ? "bg-indigo-500 text-white rounded-br-xl" : "bg-blue-600 text-white rounded-br-lg";
  const botBubbleColor = isGradient ? "bg-gray-800 text-gray-100 rounded-bl-xl" : "bg-gray-200 dark:bg-gray-800 dark:text-gray-100 rounded-bl-lg";
  const headerColor = isGradient ? "bg-gradient-to-r from-indigo-700 to-blue-800" : "bg-blue-600";
  const containerBg = isGradient ? "bg-gray-900 border border-indigo-700" : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700";
  const inputBorder = isGradient ? "border-t border-indigo-700" : "border-t border-gray-300 dark:border-gray-700";

  return (
    <>
      {/* Floating chat icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-6 text-white p-4 rounded-full shadow-xl transition-all duration-300 transform ${
            isGradient ? `bg-gradient-to-r ${primaryColor}` : primaryColor
        } hover:scale-105 z-50`}
        aria-label="Open chat"
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div 
            className={`fixed bottom-40 right-6 w-80 md:w-96 h-96 ${containerBg} rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40 transition-all duration-300 ease-out`}
        >
          {/* Chat Header */}
          <div className={`${headerColor} text-white px-4 py-3 flex justify-between items-center shadow-lg`}>
            <h3 className="font-bold">FinMate 💬</h3>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-xl max-w-[85%] shadow-md ${
                    msg.sender === "user"
                      ? userBubbleColor
                      : botBubbleColor
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Loading indicator for AI reply */}
            {isAILoading && (
                <div className="flex justify-start">
                    <div className={`${botBubbleColor} px-3 py-2 rounded-xl rounded-bl-none shadow-md`}>
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                        </div>
                    </div>
                </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input box */}
          <div className={`flex items-center ${inputBorder} px-3 py-2`}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isAILoading}
              placeholder="Ask about your expenses..."
              className="flex-1 bg-transparent outline-none px-2 text-sm dark:text-white placeholder-gray-500"
            />
            <button
              onClick={handleSend}
              disabled={isAILoading || !input.trim()}
              className={`p-2 transition-colors rounded-full ${isAILoading ? 'text-gray-500' : 'text-blue-500 hover:text-blue-300'}`}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
