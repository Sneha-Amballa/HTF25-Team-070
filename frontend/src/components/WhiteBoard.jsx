import React, { useRef, useEffect, useState } from "react";
import { getSocket } from "../services/socket";

const Whiteboard = ({ roomId }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [eraser, setEraser] = useState(false);
  const [visible, setVisible] = useState(false);
  const socket = getSocket();

  // Initialize canvas
  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth * 0.85;
    canvas.height = window.innerHeight * 0.75;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctxRef.current = ctx;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [visible]);

  // Handle remote drawing events
  useEffect(() => {
    const handleRemoteDraw = ({ x0, y0, x1, y1, color, lineWidth }) => {
      drawLine(x0, y0, x1, y1, color, lineWidth, false);
    };
    const handleRemoteClear = () => clearCanvas(false);

    socket.on("whiteboard-draw", handleRemoteDraw);
    socket.on("whiteboard-clear", handleRemoteClear);

    return () => {
      socket.off("whiteboard-draw", handleRemoteDraw);
      socket.off("whiteboard-clear", handleRemoteClear);
    };
  }, [socket]);

  // Update stroke style when color or lineWidth changes
  useEffect(() => {
    if (ctxRef.current && !eraser) {
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth, eraser]);

  const drawLine = (x0, y0, x1, y1, strokeColor, width, emit = true) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;
    socket.emit("whiteboard-draw", { roomId, x0, y0, x1, y1, color: strokeColor, lineWidth: width });
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    return { x, y };
  };

  const handleMouseDown = (e) => {
    setDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    ctxRef.current.prev = { x, y };
  };

  const handleMouseUp = () => {
    setDrawing(false);
    if (ctxRef.current) ctxRef.current.prev = null;
  };

  const handleMouseMove = (e) => {
    if (!drawing || !ctxRef.current) return;
    const { x, y } = getCanvasCoordinates(e);

    if (ctxRef.current.prev) {
      drawLine(
        ctxRef.current.prev.x,
        ctxRef.current.prev.y,
        x,
        y,
        eraser ? "#ffffff" : color,
        lineWidth
      );
    }

    ctxRef.current.prev = { x, y };
  };

  const clearCanvas = (shouldEmit = true) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (shouldEmit) {
      socket.emit("whiteboard-clear", roomId);
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <>
      <button
        onClick={() => setVisible(!visible)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          padding: "10px 15px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          zIndex: 1000,
          fontWeight: 600,
        }}
      >
        {visible ? "Close Whiteboard" : "Open Whiteboard"}
      </button>

      {visible && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            zIndex: 999,
            maxWidth: "95vw",
            maxHeight: "95vh",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#333" }}>Collaborative Whiteboard</h3>
            <button
              onClick={() => setVisible(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#666",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
              }}
              onMouseEnter={(e) => e.target.style.background = "#f0f0f0"}
              onMouseLeave={(e) => e.target.style.background = "none"}
            >
              ×
            </button>
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px", flexWrap: "wrap", padding: "10px", background: "#f8f9fa", borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontWeight: 500, fontSize: "14px" }}>Color:</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ cursor: "pointer", width: "40px", height: "30px" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontWeight: 500, fontSize: "14px" }}>Size:</label>
              <input type="range" min="1" max="20" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} style={{ cursor: "pointer" }} />
              <span style={{ fontSize: "12px", minWidth: "20px" }}>{lineWidth}</span>
            </div>

            <button onClick={() => setEraser(!eraser)} style={{ padding: "8px 12px", background: eraser ? "#ffc107" : "#6c757d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}>
              {eraser ? "✏ Pen" : "🧹 Eraser"}
            </button>

            <button onClick={() => clearCanvas(true)} style={{ padding: "8px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}>
              🗑 Clear
            </button>

            <button onClick={downloadCanvas} style={{ padding: "8px 12px", background: "#28a745", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}>
              💾 Download
            </button>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            style={{ border: "2px solid #dee2e6", borderRadius: "8px", cursor: "crosshair", display: "block", background: "white" }}
          />
        </div>
      )}
    </>
  );
};

export default Whiteboard;
