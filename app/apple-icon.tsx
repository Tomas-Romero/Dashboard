import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

function Square({ dim }: { dim: boolean }) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: dim ? "rgba(255,255,255,0.55)" : "white",
      }}
    />
  );
}

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c6df8 0%, #4cc9e8 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Square dim={false} />
            <Square dim={true} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Square dim={true} />
            <Square dim={false} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
