import { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Dropdown, Spinner, Modal, Button } from "react-bootstrap";
import { toast } from "sonner";
import { getSocket } from "../services/socket";
import EmojiPicker from "emoji-picker-react";
import { MessageCircle } from "lucide-react"; // 🟦 Chatbot icon import
import { useNavigate } from "react-router-dom";

const COMMON_EMOJIS = ["👍", "❤", "😂", "😮", "😢", "👏"];

const ChatArea = ({ selectedRoomId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate(); // Navigation hook for redirect

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!selectedRoomId) return;

    setLoading(true);
    socket.emit("joinRoom", selectedRoomId);

    socket.on("roomMessages", (roomMessages) => {
      setMessages(roomMessages);
      setLoading(false);
    });

    socket.on("newMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("roomMessages");
      socket.off("newMessage");
      socket.emit("leaveRoom", selectedRoomId);
    };
  }, [selectedRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const socket = socketRef.current;
    const messageData = {
      roomId: selectedRoomId,
      sender: currentUser,
      text: newMessage,
      timestamp: new Date(),
    };

    socket.emit("sendMessage", messageData);
    setNewMessage("");
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage((prev) => prev + emoji.emoji);
  };

  // 🟢 Function to redirect to chatbot page
  const handleChatbotRedirect = () => {
    navigate("/chatbot");
  };

  return (
    <div className="chat-area-container position-relative" style={{ height: "100%", overflow: "hidden" }}>
      <div className="chat-area bg-light rounded p-3 d-flex flex-column" style={{ height: "100%" }}>
        <div className="chat-messages flex-grow-1 overflow-auto mb-3">
          {loading ? (
            <div className="text-center mt-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted mt-5">No messages yet</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message mb-2 p-2 rounded ${
                  msg.sender === currentUser ? "bg-primary text-white align-self-end" : "bg-white border"
                }`}
                style={{ maxWidth: "70%" }}
              >
                <div className="small fw-bold">{msg.sender}</div>
                <div>{msg.text}</div>
                <div className="text-muted small mt-1">
                  {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area d-flex align-items-center gap-2">
          <button
            className="btn btn-light"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </button>
          {showEmojiPicker && (
            <div className="position-absolute bottom-100 mb-2">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
          <input
            type="text"
            className="form-control"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button className="btn btn-primary" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </div>

      {/* 🟢 Floating Chatbot Icon */}
      <button
        onClick={handleChatbotRedirect}
        className="position-fixed bottom-4 end-4 bg-primary text-white rounded-circle p-3 shadow-lg"
        style={{
          bottom: "20px",
          right: "20px",
          border: "none",
          cursor: "pointer",
          zIndex: 9999,
        }}
        title="Chat with AI Bot"
      >
        <MessageCircle size={28} />
      </button>
    </div>
  );
};

export default ChatArea;