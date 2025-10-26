import { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Dropdown, Spinner, Modal, Button } from "react-bootstrap";
import { toast } from "sonner";
import { getSocket } from "../services/socket";
import EmojiPicker from "emoji-picker-react"; // ✨ Add this import at the top


const COMMON_EMOJIS = ["👍", "❤️", "😊", "🎉", "🔥", "👏", "✅"];

const ChatArea = ({ roomId, userId, userRole, roomName, isMember }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Call states
  const [showCallModal, setShowCallModal] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Join room and handle socket events
  useEffect(() => {
    if (!roomId || !isMember) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit("joinRoom", { roomId });

    socket.on("loadMessages", (msgs) => setMessages(msgs));
    socket.on("newMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("messagePinned", ({ messageId, isPinned }) =>
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_pinned: isPinned } : msg
        )
      )
    );
    socket.on("messageDeleted", (messageId) =>
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    );
    socket.on("reactionUpdated", ({ messageId, reactions }) =>
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reactions } : msg
        )
      )
    );
    socket.on("userTyping", ({ username, userId: typingUserId, isTyping }) => {
      if (typingUserId === userId) return;
      setTypingUsers((prev) => {
        if (isTyping) return prev.includes(username) ? prev : [...prev, username];
        else return prev.filter((u) => u !== username);
      });
    });
    socket.on("updateUsers", (users) => setOnlineUsers(users));
    socket.on("userJoined", ({ username }) => toast.success(`${username} joined`));
    socket.on("userLeft", ({ username }) => toast.info(`${username} left`));

    // Call events
    socket.on("incomingCall", ({ fromId, fromName, type }) =>
      setIncomingCall({ fromId, fromName, type })
    );
    socket.on("callResponse", ({ accepted, fromName }) => {
      if (accepted) toast.success(`${fromName} accepted your call`);
      else {
        toast.error(`${fromName} declined your call`);
        endCall();
      }
    });
    socket.on("callEnded", () => {
      toast.info("Call ended");
      endCall();
    });

    return () => {
      socket.emit("leaveRoom", { roomId });
      socket.off();
    };
  }, [roomId, isMember, userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Attach media streams
  useEffect(() => {
    if (localStream) {
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      if (localAudioRef.current) localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Typing handler
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    const socket = getSocket();
    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { roomId, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { roomId, isTyping: false });
    }, 1000);
  };

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !roomId) return;
    const socket = getSocket();
    if (!socket) return toast.error("Not connected to server");

    socket.emit("sendMessage", {
      roomId,
      message: { content: newMessage.trim(), type: "text" },
    });
    setNewMessage("");
    setIsTyping(false);
    socket.emit("typing", { roomId, isTyping: false });
  };

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", file.type.startsWith("image") ? "image" : "file");

      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      const socket = getSocket();
      if (socket) {
        socket.emit("fileUploaded", {
          roomId,
          fileUrl: data.url,
          fileType: data.type,
        });
      }
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Reactions
  const handleReaction = (messageId, emoji) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("addReaction", { roomId, messageId, emoji });
  };

  // Admin actions
  const handlePinMessage = (messageId) => {
    if (userRole !== "admin") return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("pinMessage", { roomId, messageId });
  };
  const handleDeleteMessage = (messageId) => {
    if (userRole !== "admin") return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("deleteMessage", { roomId, messageId });
  };

  // Call functions
  const startCall = async (targetOrType, maybeType) => {
    const socket = getSocket();
    if (!socket) return;

    let type, targets;
    if (maybeType) {
      // Individual user call
      type = maybeType;
      targets = [{ userId: targetOrType }];
    } else {
      // Call everyone
      type = targetOrType;
      targets = onlineUsers.filter((u) => u.userId !== userId);
    }

    if (targets.length === 0) {
      toast.info("No other members online to call");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      setLocalStream(stream);
      setActiveCall({ type, status: "calling", targets: targets.map((u) => u.userId) });
      targets.forEach((target) => {
        socket.emit("callUser", { targetId: target.userId, type, roomId });
      });
      toast.success(`Calling ${targets.length} member(s)...`);
    } catch (error) {
      toast.error("Failed to access camera/microphone");
      console.error(error);
    }
  };

  const answerCall = async (accept) => {
    const socket = getSocket();
    if (!socket || !incomingCall) return;

    if (accept) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: incomingCall.type === "video",
          audio: true,
        });
        setLocalStream(stream);
        setActiveCall({
          targetUserId: incomingCall.fromId,
          type: incomingCall.type,
          status: "active",
        });
        socket.emit("answerCall", {
          toId: incomingCall.fromId,
          accepted: true,
          roomId,
        });
      } catch (error) {
        toast.error("Failed to access camera/microphone");
        socket.emit("answerCall", {
          toId: incomingCall.fromId,
          accepted: false,
          roomId,
        });
      }
    } else {
      socket.emit("answerCall", {
        toId: incomingCall.fromId,
        accepted: false,
        roomId,
      });
    }

    setIncomingCall(null);
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (activeCall) {
      const socket = getSocket();
      if (socket) socket.emit("callEnded", { toId: activeCall.targetUserId });
    }
    setActiveCall(null);
    setRemoteStream(null);
  };

  if (!roomId)
    return (
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center text-muted">
          <div style={{ fontSize: "4rem", opacity: 0.5 }}>#</div>
          <p className="fs-5">Select a room to start chatting</p>
        </div>
      </div>
    );

  if (!isMember)
    return (
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center text-muted">
          <div style={{ fontSize: "4rem", opacity: 0.5 }}>🔒</div>
          <p className="fs-5">You are not a member of this room</p>
          <p className="small">Request to join from the sidebar</p>
        </div>
      </div>
    );

  return (
    <div className="flex-grow-1 d-flex flex-column bg-white">
      {/* Header */}
      <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
          <span className="text-primary">#</span>
          {roomName}
          <span className="badge bg-success">{onlineUsers.length} online</span>
        </h5>
        <div className="d-flex justify-content-center gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              startCall("audio");
              setShowCallModal(false);
            }}
          >
            🎤 Audio Call Everyone
          </button>
          <button
            className="btn btn-success"
            onClick={() => {
              startCall("video");
              setShowCallModal(false);
            }}
          >
            📹 Video Call Everyone
          </button>
        </div>
      </div>

      {/* Active Call */}
      {activeCall && (
        <div className="p-3 bg-dark text-white">
          <div className="d-flex gap-3 justify-content-center align-items-center">
            {activeCall.type === "video" ? (
              <>
                <div>
                  <p className="small mb-1">You</p>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    style={{ width: "200px", height: "150px", borderRadius: "8px" }}
                  />
                </div>
                <div>
                  <p className="small mb-1">Remote</p>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    style={{ width: "200px", height: "150px", borderRadius: "8px" }}
                  />
                </div>
              </>
            ) : (
              <div className="text-center">
                <p>🎤 Audio Call in Progress</p>
                <audio ref={localAudioRef} autoPlay muted />
                <audio ref={remoteAudioRef} autoPlay />
              </div>
            )}
            <button className="btn btn-danger btn-sm" onClick={endCall}>
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
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
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: "40px", height: "40px", fontSize: "0.9rem" }}
                    >
                      {message.display_name[0].toUpperCase()}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-baseline gap-2 mb-1">
                        <span className="fw-semibold small">{message.display_name}</span>
                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        {message.is_pinned && <span className="badge bg-warning text-dark">📌 Pinned</span>}
                      </div>
                      {message.type === "image" ? (
                        <img
                          src={message.content}
                          alt="upload"
                          style={{ maxWidth: "300px", borderRadius: "8px" }}
                        />
                      ) : message.type === "file" ? (
                        <a
                          href={message.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          📎 Download File
                        </a>
                      ) : (
                        <p className="mb-2 small">{message.content}</p>
                      )}
                      {Object.keys(reactions).length > 0 && (
                        <div className="d-flex flex-wrap gap-1">
                          {Object.entries(reactions).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(message.id, emoji)}
                              className={`btn btn-sm d-flex align-items-center gap-1 ${
                                message.reactions.some((r) => r.user_id === userId && r.emoji === emoji)
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

                    <div className="message-actions d-flex gap-1">
                      <Dropdown>
                        <Dropdown.Toggle variant="light" size="sm" className="py-0 px-2">
                          😊
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {COMMON_EMOJIS.map((emoji) => (
                            <Dropdown.Item key={emoji} onClick={() => handleReaction(message.id, emoji)}>
                              {emoji}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                      {userRole === "admin" && (
                        <>
                          <button
                            className="btn btn-light btn-sm py-0 px-2"
                            onClick={() => handlePinMessage(message.id)}
                            title="Pin message"
                          >
                            📌
                          </button>
                          <button
                            className="btn btn-light btn-sm py-0 px-2"
                            onClick={() => handleDeleteMessage(message.id)}
                            title="Delete message"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {typingUsers.length > 0 && (
          <div className="text-muted small ps-3">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
          </div>
        )}
      </div>

      {/* Input Section */}
<div className="p-3 border-top bg-light position-relative">
  <div className="d-flex gap-2 mx-auto" style={{ maxWidth: "900px" }}>
    {/* File upload */}
    <input
      type="file"
      ref={fileInputRef}
      style={{ display: "none" }}
      onChange={handleFileUpload}
    />
    <button
      className="btn btn-outline-secondary"
      onClick={() => fileInputRef.current?.click()}
      disabled={uploading}
      title="Upload file"
    >
      {uploading ? <Spinner animation="border" size="sm" /> : "📎"}
    </button>

    {/* ✨ Emoji Picker Button */}
    <div className="position-relative">
      <button
        className="btn btn-outline-secondary"
        onClick={() => setShowEmojiPicker((prev) => !prev)}
        title="Add Emoji"
      >
        😊
      </button>

      {showEmojiPicker && (
        <div
          className="position-absolute bottom-100 mb-2"
          style={{ zIndex: 1000 }}
        >
          <EmojiPicker
            onEmojiClick={(emojiData) =>
              setNewMessage((prev) => prev + emojiData.emoji)
            }
            theme="light"
          />
        </div>
      )}
    </div>

    {/* Message input */}
    <input
      type="text"
      className="form-control"
      value={newMessage}
      onChange={handleTyping}
      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
      placeholder="Type a message..."
    />

    {/* Send button */}
    <button className="btn btn-primary" onClick={handleSendMessage}>
      Send
    </button>
  </div>
</div>


      {/* Incoming Call Modal */}
      <Modal show={!!incomingCall} onHide={() => answerCall(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Incoming {incomingCall?.type} call</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {incomingCall?.fromName} is calling you.
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="success" onClick={() => answerCall(true)}>
              Accept
            </Button>
            <Button variant="danger" onClick={() => answerCall(false)}>
              Decline
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ChatArea;
