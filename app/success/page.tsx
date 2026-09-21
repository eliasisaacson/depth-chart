"use client";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: "#090b10", color: "#c9d1d9", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#161b22", borderRadius: 16, border: "1px solid #3fb95040",
        maxWidth: 440, width: "100%", padding: "40px 32px", textAlign: "center",
        margin: 20,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#e6edf3", margin: "0 0 8px" }}>You're in!</h1>
        <p style={{ fontSize: 14, color: "#7d8590", marginBottom: 24, lineHeight: 1.5 }}>
          NBA Draft Advisor is unlocked. You now have full access to the live draft board with unlimited AI chat.
        </p>
        <button
          onClick={() => router.push("/draft/nba")}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
            background: "#f97316", color: "#000", fontSize: 15, fontWeight: 700,
            cursor: "pointer", marginBottom: 10,
          }}
        >Go to your draft board</button>
        <p style={{ fontSize: 11, color: "#484f58", marginTop: 12 }}>
          Your purchase is tied to your account. You can access the live draft from any device.
        </p>
      </div>
    </div>
  );
}
