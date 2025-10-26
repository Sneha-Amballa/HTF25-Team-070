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
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-4/5`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
            isUser ? 'bg-blue-600 ml-3' : 'bg-gray-100 mr-3'
          }`}>
            {isUser ? (
              <span className="text-white text-sm font-medium">U</span>
            ) : (
              <Cpu className="w-4 h-4 text-blue-600" />
            )}
          </div>

          {/* Message Bubble */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`px-4 py-3 rounded-2xl shadow-sm ${
              isUser 
                ? 'bg-blue-600 text-white rounded-br-md' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {message.text}
              </div>
            </div>

            {/* Sources */}
            {message.sources?.length > 0 && (
              <div className="mt-2 max-w-md">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <Search className="w-3 h-3 mr-1" />
                  Sources:
                </div>
                <div className="flex flex-wrap gap-1">
                  {message.sources.slice(0, 3).map((source, index) => (
                    <a
                      key={index}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md transition-colors duration-200 truncate max-w-[120px]"
                      title={source.title || source.uri}
                    >
                      {source.title || 'Source'}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Study<span className="text-blue-600">Bot</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Your AI study assistant
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mb-6">
                <Cpu className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                Welcome to StudyBot!
              </h2>
              <p className="text-gray-500 max-w-md leading-relaxed">
                I'm here to help you study smarter. Ask me anything about your coursework, 
                explanations, or need help understanding complex topics.
              </p>
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Try asking:</p>
                <p className="text-sm text-blue-600 italic">
                  "Explain quantum physics in simple terms"
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pb-24">
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shadow-sm">
                      <Cpu className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="w-full bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-white shadow-sm"
                placeholder="Ask me anything about your studies..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white p-3 rounded-xl shadow-sm hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[52px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            StudyBot can make mistakes. Always verify important information.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Chatbot;