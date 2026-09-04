import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

function Square({ dim }: { dim: boolean }) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: 2,
        background: dim ? "rgba(255,255,255,0.55)" : "white",
      }}
    />
  );
}

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          background: "linear-gradient(135deg, #7c6df8 0%, #4cc9e8 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", gap: 2 }}>
            <Square dim={false} />
            <Square dim={true} />
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            <Square dim={true} />
            <Square dim={false} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
