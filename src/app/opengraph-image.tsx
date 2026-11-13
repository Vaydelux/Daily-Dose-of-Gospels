import { ImageResponse } from "next/og";

export const alt = "Daily Dose of Gospels — anonymous Christian community, Verse of the Day, and a Christ-centered AI counselor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded social card: navy sanctuary, gold cross emblem, serif-feel typography. */
export default function OpengraphImage() {
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
          backgroundColor: "#1C2947",
          backgroundImage:
            "radial-gradient(circle at 50% 34%, rgba(232, 182, 76, 0.22), rgba(232, 182, 76, 0) 58%), linear-gradient(160deg, #3D4F84 0%, #2A3A66 46%, #1C2947 100%)",
          padding: "56px 80px",
        }}
      >
        {/* Emblem: scripture rings + rounded gold cross */}
        <div
          style={{
            position: "relative",
            width: 300,
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 288,
              height: 288,
              borderRadius: 999,
              border: "3px solid rgba(232, 182, 76, 0.32)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 250,
              height: 250,
              borderRadius: 999,
              border: "1px solid rgba(232, 182, 76, 0.14)",
            }}
          />
          {/* vertical bar */}
          <div
            style={{
              position: "absolute",
              left: 128,
              top: 34,
              width: 44,
              height: 232,
              borderRadius: 22,
              backgroundImage: "linear-gradient(180deg, #F1CE83 0%, #D7A748 55%, #B98B33 100%)",
            }}
          />
          {/* horizontal bar */}
          <div
            style={{
              position: "absolute",
              left: 55,
              top: 112,
              width: 190,
              height: 44,
              borderRadius: 22,
              backgroundImage: "linear-gradient(90deg, #E9BE69 0%, #D7A748 60%, #C49440 100%)",
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            color: "#F7EED8",
            letterSpacing: -1.5,
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          Daily Dose of Gospels
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "rgba(247, 238, 216, 0.78)",
            marginBottom: 30,
            textAlign: "center",
          }}
        >
          Verse of the Day · Anonymous Community · Christ-centered AI Counselor
        </div>

        {/* Domain pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 34px",
            borderRadius: 999,
            border: "1px solid rgba(232, 182, 76, 0.45)",
            color: "#E8B64C",
            fontSize: 24,
            letterSpacing: 6,
          }}
        >
          DAILYDOSEOFGOSPELS.COM
        </div>
      </div>
    ),
    { ...size }
  );
}
