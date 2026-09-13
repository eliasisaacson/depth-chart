"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";

const SECTION_MAX = 680;

export default function DepthChartLanding() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif",
      background: "#090b10", color: "#c9d1d9", minHeight: "100vh",
      overflowX: "hidden",
    }}>

      {/* ── Nav ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px", maxWidth: SECTION_MAX, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#e6edf3", letterSpacing: -0.5 }}>Depth Chart</span>
          <span style={{ fontSize: 11, color: "#f97316", fontWeight: 600 }}>NBA 2026-27</span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#7d8590", alignItems: "center" }}>
          <a href="#how" style={{ color: "inherit", textDecoration: "none" }}>How it works</a>
          <a href="#pricing" style={{ color: "inherit", textDecoration: "none" }}>Pricing</a>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #30363d", background: "transparent", color: "#c9d1d9", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Sign in</button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: SECTION_MAX, margin: "0 auto", padding: "60px 24px 40px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-block", padding: "4px 12px", borderRadius: 20,
          background: "#f9731615", border: "1px solid #f9731630",
          fontSize: 12, color: "#f97316", fontWeight: 600, marginBottom: 20,
        }}>
          🏀 NBA draft season is here
        </div>

        <h1 style={{
          fontSize: 44, fontWeight: 800, color: "#e6edf3",
          lineHeight: 1.08, margin: "0 0 16px", letterSpacing: -1.5,
        }}>
          Your fantasy draft<br />has an AI co-pilot.
        </h1>

        <p style={{
          fontSize: 17, lineHeight: 1.6, color: "#7d8590",
          maxWidth: 480, margin: "0 auto 32px",
        }}>
          Depth Chart is a live NBA draft board with an AI advisor that knows your
          league settings, tracks every pick, and tells you when value is falling.
          Run a free mock draft. Pay $9.99 when you're ready for the real thing.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/draft/nba")}
            style={{
              padding: "12px 28px", borderRadius: 8, border: "none",
              background: "#f97316", color: "#000", fontSize: 15, fontWeight: 700,
              cursor: "pointer", transition: "transform 0.15s",
            }}
          >Try a mock draft — free</button>
          <button
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              padding: "12px 28px", borderRadius: 8,
              background: "transparent", border: "1px solid #30363d",
              color: "#c9d1d9", fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}
          >See how it works</button>
        </div>
      </section>

      {/* ── Tool Preview ── */}
      <section style={{
        maxWidth: SECTION_MAX, margin: "0 auto", padding: "0 24px 60px",
      }}>
        <div style={{
          background: "#0d1117", borderRadius: 12, border: "1px solid #21262d",
          overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 14px",
            background: "#161b22", borderBottom: "1px solid #21262d",
          }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f85149" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#d29922" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3fb950" }} />
            <span style={{ marginLeft: 10, fontSize: 11, color: "#484f58" }}>depthchartsports.app/draft/nba</span>
          </div>

          <div style={{ padding: 16 }}>
            {/* Mock roster bar */}
            <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 7px", background: "#161b22", borderRadius: 4, border: "1px solid #21262d", fontSize: 10 }}>
                <span style={{ padding: "0 4px", borderRadius: 2, fontSize: 8, fontWeight: 700, background: "#e3f2fd", color: "#1565c0" }}>PG</span>
                <span style={{ fontWeight: 600, color: "#e6edf3" }}>SGA</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 7px", background: "#161b22", borderRadius: 4, border: "1px solid #21262d", fontSize: 10 }}>
                <span style={{ padding: "0 4px", borderRadius: 2, fontSize: 8, fontWeight: 700, background: "#fce4ec", color: "#c62828" }}>PF</span>
                <span style={{ fontWeight: 600, color: "#e6edf3" }}>Giannis</span>
              </div>
              {["SG","SF","C","G","F","UTIL"].map(s => (
                <div key={s} style={{ padding: "3px 7px", borderRadius: 4, border: "1px dashed #21262d", fontSize: 9, color: "#484f58" }}>{s}</div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              {/* Mini board */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f97316" }}>NBA Draft Board</div>
                    <div style={{ fontSize: 10, color: "#484f58" }}>12-Team Snake · Pick 3 · Points</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#484f58" }}>Round</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#f97316" }}>2</div>
                  </div>
                </div>
                {[
                  { pos: "C", name: "Nikola Jokić", team: "DEN", struck: true },
                  { pos: "C", name: "Victor Wembanyama", team: "SAS", struck: true },
                  { pos: "PG", name: "SGA", team: "OKC", struck: true, mine: true },
                  { pos: "SF", name: "Jayson Tatum", team: "BOS", struck: false, badge: "Q" },
                  { pos: "PF", name: "Giannis", team: "MIA", struck: true, mine: true },
                  { pos: "PG", name: "Tyrese Haliburton", team: "IND", struck: false, badge: "Q" },
                ].map((p, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 8px",
                    borderBottom: "1px solid #21262d", opacity: p.struck ? 0.4 : 1,
                    fontSize: 12,
                  }}>
                    <span style={{ width: 16, fontSize: 10, color: "#484f58", textAlign: "right" }}>{i+1}</span>
                    <span style={{ padding: "0 4px", borderRadius: 3, fontSize: 9, fontWeight: 700,
                      background: POS_COLORS[p.pos]?.bg || "#eee", color: POS_COLORS[p.pos]?.text || "#333",
                    }}>{p.pos}</span>
                    <span style={{ flex: 1, fontWeight: 500, color: "#e6edf3", textDecoration: p.struck ? "line-through" : "none" }}>
                      {p.name}
                      {p.mine && <span style={{ marginLeft: 4, fontSize: 8, fontWeight: 800, background: "#3fb950", color: "#000", padding: "0 3px", borderRadius: 2, textDecoration: "none", display: "inline-block" }}>MY PICK</span>}
                      {p.badge && <span style={{ marginLeft: 4, fontSize: 8, fontWeight: 800, background: "#d29922", color: "#000", padding: "0 3px", borderRadius: 2, textDecoration: "none", display: "inline-block" }}>{p.badge}</span>}
                    </span>
                    <span style={{ fontSize: 10, color: "#484f58" }}>{p.team}</span>
                  </div>
                ))}
              </div>

              {/* Mini advisor */}
              <div style={{ width: 200, flexShrink: 0 }}>
                <div style={{ background: "#161b22", borderRadius: 8, border: "1px solid #f9731640", padding: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 8, color: "#f97316", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Round 2 Pick #22</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <span style={{ padding: "0 4px", borderRadius: 2, fontSize: 8, fontWeight: 700, background: "#f3e5f5", color: "#6a1b9a" }}>C</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3" }}>Karl-Anthony Towns</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4, lineHeight: 1.3 }}>
                    No center yet. KAT is the last elite C — after him it's a steep cliff. Lock this in.
                  </div>
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#f97316", marginBottom: 4 }}>Talk it out</div>
                <div style={{ padding: "5px 8px", borderRadius: 6, fontSize: 10, background: "#f97316", color: "#000", display: "inline-block", maxWidth: "80%", float: "right", marginBottom: 4 }}>Why not Haliburton here?</div>
                <div style={{ clear: "both" }} />
                <div style={{ padding: "5px 8px", borderRadius: 6, fontSize: 10, lineHeight: 1.3, background: "#161b22", color: "#c9d1d9", border: "1px solid #21262d", maxWidth: "90%" }}>
                  You already have SGA at PG. The center cliff after KAT is brutal — Haliburton will be there next round.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" style={{
        maxWidth: SECTION_MAX, margin: "0 auto", padding: "40px 24px 60px",
      }}>
        <h2 style={{
          fontSize: 28, fontWeight: 800, color: "#e6edf3",
          letterSpacing: -0.5, marginBottom: 32, textAlign: "center",
        }}>
          Not another rankings site.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            {
              icon: "🤖",
              title: "AI co-pilot that debates you",
              desc: "Not a bot that agrees with everything. Ask it why, challenge the pick, run scenarios. It knows your roster, your strategy, and who's left on the board."
            },
            {
              icon: "📊",
              title: "Multi-source consensus rankings",
              desc: "Rankings aggregated across FantasyPros, Hashtag Basketball, ESPN, and more. Updated through draft season. Import your own via CSV."
            },
            {
              icon: "❗",
              title: "Steal alerts (!  !!  !!!)",
              desc: "Real-time flags when players slip past their ADP. One ! at 7 spots. Three !!! at 25. The board shouts at you when value is falling."
            },
            {
              icon: "📉",
              title: "Positional drop-off warnings",
              desc: "See when there's a cliff at center or point guard. Grab the last elite C before the gap becomes a canyon."
            },
            {
              icon: "🏥",
              title: "Live injury flags",
              desc: "Questionable, Out, and Monitor badges on every player. Hover for the full story. Load management risks flagged."
            },
            {
              icon: "🏀",
              title: "Points & category league support",
              desc: "Toggle between points league and 9-category formats. The advisor adjusts strategy — punt builds, category scarcity, and positional value shift with your format."
            },
          ].map((f, i) => (
            <div key={i} style={{
              background: "#0d1117", borderRadius: 10, border: "1px solid #21262d",
              padding: 20,
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3", marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: "#7d8590" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works Steps ── */}
      <section style={{
        maxWidth: SECTION_MAX, margin: "0 auto", padding: "0 24px 60px",
      }}>
        <h2 style={{
          fontSize: 28, fontWeight: 800, color: "#e6edf3",
          letterSpacing: -0.5, marginBottom: 32, textAlign: "center",
        }}>
          Draft day in 3 steps.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { step: "1", title: "Run a mock draft", desc: "Practice against AI opponents. Full 13-round draft with the advisor coaching you in real time. Free, unlimited." },
            { step: "2", title: "Unlock your real draft", desc: "Pay $9.99 to use the board during your actual league draft. Same AI, same features — now it counts." },
            { step: "3", title: "Draft with confidence", desc: "Cross off picks as your league drafts. The AI updates its recommendation every pick. Debate it, challenge it, trust it." },
          ].map((s, i) => (
            <div key={i} style={{
              background: "#0d1117", borderRadius: 10, border: "1px solid #21262d",
              padding: 20, textAlign: "center",
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f97316", marginBottom: 8 }}>{s.step}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3", marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: "#7d8590" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{
        maxWidth: SECTION_MAX, margin: "0 auto", padding: "0 24px 60px",
      }}>
        <h2 style={{
          fontSize: 28, fontWeight: 800, color: "#e6edf3",
          letterSpacing: -0.5, marginBottom: 8, textAlign: "center",
        }}>
          Simple pricing. No subscriptions.
        </h2>
        <p style={{
          fontSize: 14, color: "#7d8590", textAlign: "center", marginBottom: 28,
        }}>
          Mock drafts are free. Pay once to unlock your real draft.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Mock Draft (Free) */}
          <div style={{
            background: "#0d1117", borderRadius: 12,
            border: "1px solid #21262d", padding: 24,
          }}>
            <div style={{ fontSize: 12, color: "#7d8590", fontWeight: 600, marginBottom: 4 }}>Mock Draft</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#e6edf3" }}>Free</div>
            <div style={{ fontSize: 12, color: "#484f58", marginBottom: 16 }}>unlimited</div>
            <div style={{ fontSize: 13, color: "#7d8590", lineHeight: 1.8 }}>
              Full 13-round mock draft<br />
              AI-simulated opponents<br />
              AI advisor with stock questions<br />
              Steal alerts & drop-off warnings<br />
              Injury flags & position tracking
            </div>
            <button
              onClick={() => router.push("/draft/nba")}
              style={{
              marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 6,
              background: "transparent", border: "1px solid #30363d",
              color: "#c9d1d9", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Try a mock draft</button>
          </div>

          {/* Live Draft ($9.99) */}
          <div style={{
            background: "#0d1117", borderRadius: 12,
            border: "1px solid #f9731640", padding: 24, position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -10, right: 16, padding: "3px 10px",
              borderRadius: 10, background: "#f97316", color: "#000",
              fontSize: 10, fontWeight: 700,
            }}>Draft day ready</div>
            <div style={{ fontSize: 12, color: "#f97316", fontWeight: 600, marginBottom: 4 }}>Live Draft</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#e6edf3" }}>$9.99</span>
            </div>
            <div style={{ fontSize: 12, color: "#484f58", marginBottom: 16 }}>one-time · NBA 2026-27 season</div>
            <div style={{ fontSize: 13, color: "#c9d1d9", lineHeight: 1.8 }}>
              Everything in Mock Draft, plus:<br />
              <span style={{ color: "#f97316", fontWeight: 600 }}>Unlimited AI chat — debate any pick</span><br />
              <span style={{ color: "#f97316", fontWeight: 600 }}>Use during your real league draft</span><br />
              <span style={{ color: "#f97316", fontWeight: 600 }}>Custom scoring & league settings</span><br />
              <span style={{ color: "#f97316", fontWeight: 600 }}>CSV import your own rankings</span>
            </div>
            <button
              onClick={() => router.push("/draft/nba")}
              style={{
              marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 6,
              background: "#f97316", border: "none",
              color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>Get started — $9.99</button>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        maxWidth: SECTION_MAX, margin: "0 auto", padding: "0 24px 60px",
      }}>
        <div style={{
          background: "#161b22", borderRadius: 12, border: "1px solid #21262d",
          padding: 32, textAlign: "center",
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#e6edf3", marginBottom: 8, marginTop: 0 }}>
            Your draft is coming. Be ready.
          </h3>
          <p style={{ fontSize: 13, color: "#7d8590", marginBottom: 20, lineHeight: 1.5 }}>
            Run a mock draft right now — no account needed.<br />
            See the board, feel the AI, and decide if it's worth $9.99.
          </p>
          <button
            onClick={() => router.push("/draft/nba")}
            style={{
              padding: "12px 32px", borderRadius: 8, border: "none",
              background: "#f97316", color: "#000", fontSize: 15,
              fontWeight: 700, cursor: "pointer",
            }}>Start a mock draft — free</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        maxWidth: SECTION_MAX, margin: "0 auto", padding: "20px 24px 40px",
        textAlign: "center", fontSize: 11, color: "#30363d",
      }}>
        Depth Chart Sports is not affiliated with ESPN, Yahoo, or any fantasy platform.<br />
        Rankings are sourced from publicly available expert consensus data.<br />
        © 2026 Depth Chart Sports · Built for people who hate losing.
      </footer>
    </div>
  );
}

const POS_COLORS = {
  PG: { bg: "#e3f2fd", text: "#1565c0" },
  SG: { bg: "#e8f5e9", text: "#2e7d32" },
  SF: { bg: "#fff3e0", text: "#e65100" },
  PF: { bg: "#fce4ec", text: "#c62828" },
  C:  { bg: "#f3e5f5", text: "#6a1b9a" },
};
