import { ImageResponse } from "next/og";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "Sundarban Yatri").slice(0, 120);
  const kicker = (searchParams.get("kicker") || "").slice(0, 60);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #10291f 0%, #1b563f 70%, #27714f 100%)",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
              color: "#1b563f",
            }}
          >
            S
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#ffffff", letterSpacing: -0.5 }}>Sundarban Yatri</div>
            <div style={{ fontSize: 20, color: "#9fd4b8" }}>Tours • Safari • Travel Guides</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {kicker ? (
            <div
              style={{
                alignSelf: "flex-start",
                fontSize: 22,
                fontWeight: 600,
                color: "#eafff2",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 999,
                padding: "8px 22px",
              }}
            >
              {kicker}
            </div>
          ) : null}
          <div
            style={{
              fontSize: title.length > 80 ? 52 : 64,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#ffffff",
              letterSpacing: -1.5,
              display: "flex",
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, color: "#9fd4b8" }}>sundarbanyatra.com</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 56, height: 8, borderRadius: 999, background: "#9fd4b8" }} />
            <div style={{ width: 28, height: 8, borderRadius: 999, background: "#eafff2" }} />
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
