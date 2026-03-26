import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const w = parseInt(searchParams.get("w") ?? "1170");
  const h = parseInt(searchParams.get("h") ?? "2532");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#EDE8F9",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 72, lineHeight: 1 }}>💞</div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#6d4fc2",
            letterSpacing: -1,
          }}
        >
          Tether
        </div>
      </div>
    ),
    { width: w, height: h }
  );
}
