import { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Dropdown, Spinner, Modal, Button } from "react-bootstrap";
import { toast } from "sonner";
import { getSocket } from "../services/socket";

const COMMON_EMOJIS = ["👍", "❤️", "😊", "🎉", "🔥", "👏", "✅"];

const ChatArea = ({ roomId, userId, userRole, roomName, isMember }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
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

  useEffect(() => {
    if (!roomId || !isMember) return;

    const socket = getSocket();
    if (!socket) return;

    // Join room
    socket.emit('joinRoom', { roomId });

    // Load existing messages
    socket.on('loadMessages', (msgs) => {
      setMessages(msgs);
    });

    // New message
    socket.on('newMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Message pinned
    socket.on('messagePinned', ({ messageId, isPinned }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_pinned: isPinned } : msg
        )
      );
    });

    // Message deleted
    socket.on('messageDeleted', (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    // Reaction updated
    socket.on('reactionUpdated', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reactions } : msg
        )
      );
    });

    // User typing
    socket.on('userTyping', ({ username, userId: typingUserId, isTyping }) => {
      if (typingUserId === userId) return;
      
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(username) ? prev : [...prev, username];
        } else {
          return prev.filter((u) => u !== username);
        }
      });
    });

    // Online users update
    socket.on('updateUsers', (users) => {
      setOnlineUsers(users);
    });

    // User joined/left
    socket.on('userJoined', ({ username }) => {
      toast.success(`${username} joined the room`);
    });

    socket.on('userLeft', ({ username }) => {
      toast.info(`${username} left the room`);
    });

    // Call events
    socket.on('incomingCall', ({ fromId, fromName, type }) => {
      setIncomingCall({ fromId, fromName, type });
    });

    socket.on('callResponse', async ({ accepted, fromName }) => {
      if (accepted) {
        toast.success(`${fromName} accepted your call`);
      } else {
        toast.error(`${fromName} declined your call`);
        endCall();
      }
    });

    socket.on('callEnded', () => {
      toast.info('Call ended');
      endCall();
    });

    return () => {
      socket.emit('leaveRoom', { roomId });
      socket.off('loadMessages');
      socket.off('newMessage');
      socket.off('messagePinned');
      socket.off('messageDeleted');
      socket.off('reactionUpdated');
      socket.off('userTyping');
      socket.off('updateUsers');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('incomingCall');
      socket.off('callResponse');
      socket.off('callEnded');
    };
  }, [roomId, isMember, userId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup local video/audio stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Setup remote video/audio stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    const socket = getSocket();
    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { roomId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { roomId, isTyping: false });
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !roomId) return;

    const socket = getSocket();
    if (!socket) {
      toast.error("Not connected to server");
      return;
    }

    socket.emit('sendMessage', {
      roomId,
      message: {
        content: newMessage.trim(),
        type: 'text',
      },
    });

    setNewMessage("");
    setIsTyping(false);
    socket.emit('typing', { roomId, isTyping: false });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', file.type.startsWith('image') ? 'image' : 'file');

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      const socket = getSocket();
      if (socket) {
        socket.emit('fileUploaded', {
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
      e.target.value = '';
    }
  };

  const handleReaction = (messageId, emoji) => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('addReaction', { roomId, messageId, emoji });
  };

  const handlePinMessage = (messageId) => {
    if (userRole !== "admin") return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('pinMessage', { roomId, messageId });
  };

  const handleDeleteMessage = (messageId) => {
    if (userRole !== "admin") return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('deleteMessage', { roomId, messageId });
  };

  // Call functions
  const startCall = async (targetUserId, type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      });

      setLocalStream(stream);
      setActiveCall({ targetUserId, type, status: 'calling' });

      const socket = getSocket();
      if (socket) {
        socket.emit('callUser', { targetId: targetUserId, type, roomId });
      }
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
          video: incomingCall.type === 'video',
          audio: true,
        });

        setLocalStream(stream);
        setActiveCall({ 
          targetUserId: incomingCall.fromId, 
          type: incomingCall.type, 
          status: 'active' 
        });

        socket.emit('answerCall', { toId: incomingCall.fromId, accepted: true, roomId });
      } catch (error) {
        toast.error("Failed to access camera/microphone");
        socket.emit('answerCall', { toId: incomingCall.fromId, accepted: false, roomId });
      }
    } else {
      socket.emit('answerCall', { toId: incomingCall.fromId, accepted: false, roomId });
    }

    setIncomingCall(null);
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (activeCall) {
      const socket = getSocket();
      if (socket) {
        socket.emit('callEnded', { toId: activeCall.targetUserId });
      }
    }

    setActiveCall(null);
    setRemoteStream(null);
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
      <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
          <span className="text-primary">#</span>
          {roomName}
          <span className="badge bg-success">{onlineUsers.length} online</span>
        </h5>
        <button 
          className="btn btn-sm btn-primary"
          onClick={() => setShowCallModal(true)}
        >
          📞 Call
        </button>
      </div>

      {/* Active Call Display */}
      {activeCall && (
        <div className="p-3 bg-dark text-white">
          <div className="d-flex gap-3 justify-content-center">
            {activeCall.type === 'video' && (
              <>
                <div>
                  <p className="small mb-1">You</p>
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    muted 
                    style={{ width: '200px', height: '150px', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <p className="small mb-1">Remote</p>
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    style={{ width: '200px', height: '150px', borderRadius: '8px' }}
                  />
                </div>
              </>
            )}
            {activeCall.type === 'audio' && (
              <div className="text-center">
                <p>🎤 Audio Call in Progress</p>
                <audio ref={localVideoRef} autoPlay muted />
                <audio ref={remoteVideoRef} autoPlay />
              </div>
            )}
            <button className="btn btn-danger btn-sm" onClick={endCall}>
              End Call
            </button>
          </div>
        </div>
      )}

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
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "40px", height: "40px", fontSize: "0.9rem" }}>
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

                      {/* Message body */}
                      {message.type === 'image' ? (
                        <img src={message.content} alt="upload" style={{ maxWidth: "300px", borderRadius: "8px" }} />
                      ) : message.type === 'file' ? (
                        <a href={message.content} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                          📎 Download File
                        </a>
                      ) : (
                        <p className="mb-2 small">{message.content}</p>
                      )}
                      
                      {/* Reactions */}
                      {Object.keys(reactions).length > 0 && (
                        <div className="d-flex flex-wrap gap-1">
                          {Object.entries(reactions).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(message.id, emoji)}
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
                              onClick={() => handleReaction(message.id, emoji)}
                            >
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

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="text-muted small ps-3">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-3 border-top bg-light">
        <div className="d-flex gap-2 mx-auto" style={{ maxWidth: "900px" }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            className="btn btn-outline-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Upload file"
          >
            {uploading ? <Spinner animation="border" size="sm" /> : '📎'}
          </button>
          <input
            type="text"
            className="form-control"
            value={newMessage}
            onChange={handleTyping}
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

      {/* Call Selection Modal */}
      <Modal show={showCallModal} onHide={() => setShowCallModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Call a Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {onlineUsers.filter(u => u.userId !== userId).length === 0 ? (
            <p className="text-muted text-center">No other members online</p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {onlineUsers
                .filter(u => u.userId !== userId)
                .map((user) => (
                  <div key={user.userId} className="d-flex justify-content-between align-items-center p-2 border rounded">
                    <span>{user.username}</span>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          startCall(user.userId, 'audio');
                          setShowCallModal(false);
                        }}
                      >
                        🎤 Audio
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          startCall(user.userId, 'video');
                          setShowCallModal(false);
                        }}
                      >
                        📹 Video
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Incoming Call Modal */}
      <Modal show={!!incomingCall} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Incoming {incomingCall?.type} Call</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-center">
            <strong>{incomingCall?.fromName}</strong> is calling you
          </p>
          <p className="text-center">
            {incomingCall?.type === 'video' ? '📹 Video Call' : '🎤 Audio Call'}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => answerCall(false)}>
            Decline
          </Button>
          <Button variant="success" onClick={() => answerCall(true)}>
            Accept
          </Button>
        </Modal.Footer>
      </Modal>

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