import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, Loader2, Search } from 'lucide-react';

// --- API Configuration ---
const apiKey = "AIzaSyDSQkcYAyJ3UnNx9kj3olI9R0aOX8Vu38A";
const modelName = "gemini-2.5-flash-preview-09-2025";
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

const systemInstruction =
  "You are Gemini, a helpful, friendly, and expert AI assistant. Your responses should be informative, concise, and professional, and you should use Markdown formatting liberally.";

// --- Retry helper ---
const withRetry = async (fn, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Attempt ${attempt + 1} failed. Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const payload = {
        prompt: [
          { role: 'system', content: [{ text: systemInstruction }] },
          { role: 'user', content: [{ text: userMessage }] },
        ],
      };

      const fetchContent = async () => {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      };

      const result = await withRetry(fetchContent);
      const candidate = result.candidates?.[0];

      let aiText = "Sorry, I couldn't generate a response.";
      let sources = [];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        aiText = candidate.content.parts[0].text;
        const groundingMetadata = candidate.groundingMetadata;
        if (groundingMetadata?.groundingAttributions) {
          sources = groundingMetadata.groundingAttributions
            .map((attr) => ({ uri: attr.web?.uri, title: attr.web?.title }))
            .filter((s) => s.uri && s.title);
        }
      }

      setMessages((prev) => [...prev, { role: 'model', text: aiText, sources }]);
    } catch (error) {
      console.error('Gemini API Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'An error occurred while connecting to the AI. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const ChatMessage = ({ message }) => {
    const isUser = message.role === 'user';
    const bubbleClass = isUser
      ? 'bg-blue-600 text-white rounded-br-none ml-auto'
      : 'bg-gray-100 text-gray-800 rounded-tl-none mr-auto';
    const icon = isUser ? null : <Cpu className="w-5 h-5 text-blue-600" />;

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shadow-md">
            {icon}
          </div>
        )}
        <div
          className={`max-w-[80%] p-3 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-[1.01] ${bubbleClass}`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
          {message.sources?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-300/50 text-xs text-gray-600">
              <div className="flex items-center font-semibold mb-1 text-gray-500">
                <Search className="w-3 h-3 mr-1" /> Sources:
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {message.sources.slice(0, 3).map((source, index) => (
                  <li key={index} className="truncate">
                    <a
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {source.title || source.uri}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col antialiased">
      {/* Header */}
      <header className="w-full bg-white shadow-md p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center justify-center">
          <Cpu className="w-6 h-6 mr-2 text-blue-600" />
          <span className="text-blue-600">Gemini</span> Chatbot
        </h1>
        <p className="text-sm text-gray-500 text-center mt-1">
          Ask me anything! Powered by the Gemini API.
        </p>
      </header>

      {/* Chat Area */}
      <main className="flex-grow p-4 md:p-6 overflow-y-auto max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <Cpu className="w-12 h-12 text-blue-400 mb-4" />
            <p className="text-xl text-gray-600 font-medium">
              Start a conversation. Try asking: "What are the latest developments in AI?"
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-4 pb-20">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 shadow-md">
                  <Cpu className="w-5 h-5 text-blue-600 animate-pulse" />
                </div>
                <div className="bg-gray-100 p-3 rounded-xl rounded-tl-none shadow-lg text-gray-800">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white shadow-t-2xl p-4 sticky bottom-0 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex space-x-3">
          <input
            type="text"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-inner"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-lg shadow-md hover:bg-blue-700 transition duration-150 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Chatbot;
