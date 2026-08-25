import { useEffect, useRef } from "react";

export default function QRScanner({ open, status, videoRef, onClose }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 20
      }}
    >
      <div
        style={{
          width: "min(480px, 100%)",
          background: "#1F2937",
          border: "1px solid #1e293b",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)"
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#E8F0EB", marginBottom: 4 }}>
          Ler QR Code
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
          {status || "Aponte a câmera para um QR Code"}
        </p>

        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: "100%",
            aspectRatio: "3 / 4",
            objectFit: "cover",
            borderRadius: 14,
            background: "#0B0F19"
          }}
        />

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "12px 16px",
            background: "transparent",
            border: "1px solid #334155",
            borderRadius: 12,
            color: "#E8F0EB",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600
          }}
        >
          FECHAR CÂMERA
        </button>
      </div>
    </div>
  );
}
