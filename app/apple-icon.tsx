import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Misma marca que app/icon.tsx, escalada — ver components/dashboard/brand-mark.tsx.
export default function AppleIcon() {
  const s = 180;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", width: s * 0.6, height: s * 0.16 }}>
            <div style={{ flex: 1, background: "#ffffff" }} />
            <div style={{ flex: 1, background: "rgba(255,255,255,0.72)" }} />
          </div>
          <div
            style={{
              width: s * 0.17,
              height: s * 0.4,
              marginTop: s * 0.045,
              background: "#ffffff",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
