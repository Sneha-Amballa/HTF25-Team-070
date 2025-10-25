import { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Dropdown } from "react-bootstrap";

const COMMON_EMOJIS = ["👍", "❤️", "😊", "🎉", "🔥", "👏", "✅"];

const ChatArea = ({
  roomId,
  isMember,
  userId,
  userRole,
  roomName,
  messages,
  onSendMessage,
  onReaction,
  onPinMessage,
  onDeleteMessage,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !roomId) return;
    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  if (!roomId) {
    return (
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center text-muted">
          <div style={{ fontSize: "4rem", opacity: 0.5 }}>#</div>
          <p className="fs-5">Select a room to start chatting</p>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center text-muted">
          <div style={{ fontSize: "4rem", opacity: 0.5 }}>🔒</div>
          <p className="fs-5">You are not a member of this room</p>
          <p className="small">Request to join from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow-1 d-flex flex-column bg-white">
      {/* Header */}
      <div className="p-3 border-bottom bg-light">
        <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
          <span className="text-primary">#</span>
          {roomName}
        </h5>
      </div>

      {/* Messages Area */}
      <div className="flex-grow-1 overflow-auto p-3">
        <div className="mx-auto" style={{ maxWidth: "900px" }}>
          {messages.length === 0 ? (
            <div className="text-center text-muted mt-5">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const reactions = message.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {});

              return (
                <div key={message.id} className="mb-3 message-group">
                  <div className="d-flex align-items-start gap-2">
                    {/* Avatar */}
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: "40px", height: "40px", fontSize: "0.9rem" }}
                    >
                      {message.display_name[0].toUpperCase()}
                    </div>

                    {/* Message Content */}
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-baseline gap-2 mb-1">
                        <span className="fw-semibold small">{message.display_name}</span>
                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        {message.is_pinned && (
                          <span className="badge bg-warning text-dark">📌 Pinned</span>
                        )}
                      </div>
                      <p className="mb-2 small">{message.content}</p>

                      {/* Reactions */}
                      {Object.keys(reactions).length > 0 && (
                        <div className="d-flex flex-wrap gap-1">
                          {Object.entries(reactions).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={() => onReaction(message.id, emoji, userId)}
                              className={`btn btn-sm d-flex align-items-center gap-1 ${
                                message.reactions.some(
                                  (r) => r.user_id === userId && r.emoji === emoji
                                )
                                  ? "btn-primary"
                                  : "btn-outline-secondary"
                              }`}
                              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                            >
                              <span>{emoji}</span>
                              <span>{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="message-actions d-flex gap-1">
                      <Dropdown>
                        <Dropdown.Toggle variant="light" size="sm" className="py-0 px-2">
                          😊
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {COMMON_EMOJIS.map((emoji) => (
                            <Dropdown.Item
                              key={emoji}
                              onClick={() => onReaction(message.id, emoji, userId)}
                            >
                              {emoji}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>

                      {/* Pin only for owner/moderator */}
                      {(userRole === "owner" || userRole === "admin") && (
                        <button
                          className="btn btn-light btn-sm py-0 px-2"
                          onClick={() => onPinMessage(message.id)}
                          title="Pin message"
                        >
                          📌
                        </button>
                      )}

                      {/* Delete available for all */}
                      <button
                        className="btn btn-light btn-sm py-0 px-2"
                        onClick={() => onDeleteMessage(message.id)}
                        title="Delete message"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="p-3 border-top bg-light">
        <div className="d-flex gap-2 mx-auto" style={{ maxWidth: "900px" }}>
          <input
            type="text"
            className="form-control"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button
            className="btn btn-primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            ➤
          </button>
        </div>
      </div>

      <style>{`
        .message-actions {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .message-group:hover .message-actions {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default ChatArea;
