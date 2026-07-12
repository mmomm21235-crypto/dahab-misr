import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "ذهب مصر";
  const subtitle = searchParams.get("subtitle") ?? "أسعار الذهب لحظة بلحظة";
  const price = searchParams.get("price") ?? "";
  const type = searchParams.get("type") ?? "default";

  const bgColor = type === "news" ? "#1e1b4b" : type === "calculator" ? "#422006" : "#1a1a1a";
  const accentColor = "#f59e0b";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: bgColor,
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient circles */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentColor}33, transparent)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentColor}22, transparent)`,
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: `linear-gradient(135deg, ${accentColor}, #d97706)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            ذ
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            ذهب مصر
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: price ? "56px" : "64px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.2,
            marginBottom: price ? "16px" : "8px",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "#a3a3a3",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          {subtitle}
        </div>

        {/* Price badge */}
        {price && (
          <div
            style={{
              marginTop: "24px",
              padding: "12px 32px",
              borderRadius: "16px",
              background: `${accentColor}22`,
              border: `2px solid ${accentColor}44`,
              fontSize: "32px",
              fontWeight: "bold",
              color: accentColor,
            }}
          >
            {price}
          </div>
        )}

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#525252",
            fontSize: "16px",
          }}
        >
          <span>dahab-misr.vercel.app</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
