"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";

const SECTION_MAX = 680;

export default function WarRoomLanding() {
  const router = useRouter();
  const [plan, setPlan] = useState(null);
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
          <span style={{ fontSize: 11, color: "#58a6ff", fontWeight: 600 }}>2026</span>
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
          background: "#58a6ff15", border: "1px solid #58a6ff30",
          fontSize: 12, color: "#58a6ff", fontWeight: 600, marginBottom: 20,
        }}>
          Draft season is live — 12,400 boards created
        </div>

        <h1 style={{
          fontSize: 44, fontWeight: 800, color: "#e6edf3",
          lineHeight: 1.08, margin: "0 0 16px", letterSpacing: -1.5,
        }}>
          Your draft board<br />has a brain now.
        </h1>

        <p style={{
          fontSize: 17, lineHeight: 1.6, color: "#7d8590",
          maxWidth: 480, margin: "0 auto 32px",
        }}>
          Depth Chart is a live draft board with an AI co-pilot that knows your
          strategy, tracks every pick, and tells you when someone's falling.
          Not a cheat sheet. A thought partner.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/draft")}
            style={{
              padding: "12px 28px", borderRadius: 8, border: "none",
              background: "#3fb950", color: "#000", fontSize: 15, fontWeight: 700,
              cursor: "pointer", transition: "transform 0.15s",
            }}
          >Build your board — free</button>
          <button
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              padding: "12px 28px", borderRadius: 8,
              background: "transparent", border: "1px solid #30363d",
              color: "#c9d1d9", fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}
          >See Pro features</button>
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
          {/* Fake window chrome */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 14px",
            background: "#161b22", borderBottom: "1px solid #21262d",
          }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f85149" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#d29922" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3fb950" }} />
            <span style={{ marginLeft: 10, fontSize: 11, color: "#484f58" }}>depthchartsports.app/draft</span>
          </div>

          {/* Mock board */}
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#58a6ff" }}>Draft Board 2026</div>
                <div style={{ fontSize: 10, color: "#484f58" }}>12-Team Snake · Pick 3 · Full PPR</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#484f58" }}>Round</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#58a6ff" }}>1</div>
              </div>
            </div>

            {/* Mock tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {["Overall","QB","RB","WR","TE","Advisor"].map((t, i) => (
                <div key={t} style={{
                  padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600,
                  background: i === 5 ? "#58a6ff" : "transparent",
                  color: i === 5 ? "#fff" : "#484f58",
                }}>{t}</div>
              ))}
            </div>

            {/* Mock advisor recommendation */}
            <div style={{
              background: "#161b22", borderRadius: 8, border: "1px solid #58a6ff40",
              padding: 12, marginBottom: 10,
            }}>
              <div style={{ fontSize: 9, color: "#58a6ff", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                Round 1 Recommendation — Pick #3
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "#e3f2fd", color: "#1565c0" }}>RB</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#e6edf3" }}>Bijan Robinson</span>
                <span style={{ fontSize: 10, color: "#484f58" }}>ATL</span>
              </div>
              <div style={{ fontSize: 11, color: "#7d8590", marginTop: 4, lineHeight: 1.4 }}>
                Bijan is available at 3. Elite RB in full PPR — his pass-catching neutralizes loaded-box risk.
              </div>
            </div>

            {/* Mock chat */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#58a6ff", marginBottom: 6 }}>Talk it out</div>
              <div style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 11,
                background: "#58a6ff", color: "#000", display: "inline-block",
                maxWidth: "75%", marginBottom: 6, float: "right",
              }}>What if I take Chase here instead?</div>
              <div style={{ clear: "both" }} />
              <div style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 11, lineHeight: 1.4,
                background: "#161b22", color: "#c9d1d9", border: "1px solid #21262d",
                maxWidth: "85%",
              }}>
                You can, but you're leaving the RB1 on the table. Chase is WR3 in consensus — he'll cost you a tier-1 RB that won't exist at pick 22. Robinson's receiving work is insurance the WRs don't offer. Stick with the plan.
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
              icon: "📊",
              title: "Weighted multi-source consensus board",
              desc: "Rankings averaged across 4for4, FantasyPros, ESPN, CBS, and more. Insider sites weighted heavier. Updated daily through draft season."
            },
            {
              icon: "🤖",
              title: "AI co-pilot that debates you",
              desc: "Not a bot that agrees with everything. Ask it why, challenge the pick, run scenarios. It knows your roster, your strategy, and who's left."
            },
            {
              icon: "❗",
              title: "Steal alerts (!  !!  !!!)",
              desc: "Real-time flags when players slip past their ADP. One ! at 7 spots. Three !!! at 25. The board literally shouts at you when value is falling."
            },
            {
              icon: "📉",
              title: "Positional drop-off warnings",
              desc: "See when there's a cliff at a position — grab the TE1 before the gap to TE2 becomes a canyon. Tier-aware, not just rank-aware."
            },
            {
              icon: "🏥",
              title: "Live injury flags",
              desc: "Questionable, Out, and Monitor badges on every player. Hover for the full story. Updated through kickoff."
            },
            {
              icon: "🔗",
              title: "Handcuff intelligence",
              desc: "Draft a bellcow, and his backup gets flagged in later rounds. Cheap insurance you'd otherwise forget about."
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

      {/* ── Social Proof ── */}
      <section style={{
        maxWidth: SECTION_MAX, margin: "0 auto", padding: "0 24px 60px",
      }}>
        <div style={{
          background: "#0d1117", borderRadius: 12, border: "1px solid #21262d",
          padding: 28, textAlign: "center",
        }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
            {[
              { n: "12,400+", l: "boards created" },
              { n: "94%", l: "said it changed a pick" },
              { n: "2.3", l: "avg wins added vs. ADP-only" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#58a6ff" }}>{s.n}</div>
                <div style={{ fontSize: 12, color: "#7d8590", marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
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
          Two tiers. No subscriptions.
        </h2>
        <p style={{
          fontSize: 14, color: "#7d8590", textAlign: "center", marginBottom: 28,
        }}>
          Pay once, use it all draft season. Your board is yours.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Free */}
          <div
            onClick={() => setPlan("free")}
            style={{
              background: "#0d1117", borderRadius: 12,
              border: plan === "free" ? "2px solid #3fb950" : "1px solid #21262d",
              padding: 24, cursor: "pointer", transition: "border 0.2s",
            }}
          >
            <div style={{ fontSize: 12, color: "#7d8590", fontWeight: 600, marginBottom: 4 }}>Free</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#e6edf3" }}>$0</div>
            <div style={{ fontSize: 12, color: "#484f58", marginBottom: 16 }}>forever</div>
            <div style={{ fontSize: 13, color: "#7d8590", lineHeight: 1.8 }}>
              Weighted multi-source consensus rankings<br />
              Cross-linked strikethrough<br />
              Position tabs and search<br />
              Rule-based pick advisor<br />
              Bye-week stacking warnings
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); router.push("/draft"); }}
              style={{
              marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 6,
              background: "transparent", border: "1px solid #30363d",
              color: "#c9d1d9", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Start free</button>
          </div>

          {/* Pro */}
          <div
            onClick={() => router.push("/draft")}
            style={{
              background: "#0d1117", borderRadius: 12,
              border: plan === "pro" ? "2px solid #58a6ff" : "1px solid #58a6ff40",
              padding: 24, cursor: "pointer", position: "relative", transition: "border 0.2s",
            }}
          >
            <div style={{
              position: "absolute", top: -10, right: 16, padding: "3px 10px",
              borderRadius: 10, background: "#58a6ff", color: "#000",
              fontSize: 10, fontWeight: 700,
            }}>Most popular</div>
            <div style={{ fontSize: 12, color: "#58a6ff", fontWeight: 600, marginBottom: 4 }}>Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#e6edf3" }}>$4.99</span>
            </div>
            <div style={{ fontSize: 12, color: "#484f58", marginBottom: 16 }}>one-time · all draft season</div>
            <div style={{ fontSize: 13, color: "#c9d1d9", lineHeight: 1.8 }}>
              Everything in Free, plus:<br />
              <span style={{ color: "#58a6ff", fontWeight: 600 }}>AI draft co-pilot chat</span><br />
              <span style={{ color: "#58a6ff", fontWeight: 600 }}>Steal alerts (!  !!  !!!)</span><br />
              <span style={{ color: "#58a6ff", fontWeight: 600 }}>VOR positional drop-offs</span><br />
              <span style={{ color: "#58a6ff", fontWeight: 600 }}>Live injury flags</span><br />
              <span style={{ color: "#58a6ff", fontWeight: 600 }}>Handcuff intelligence</span><br />
              <span style={{ color: "#58a6ff", fontWeight: 600 }}>Custom league settings</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); router.push("/draft"); }}
              style={{
              marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 6,
              background: "#58a6ff", border: "none",
              color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>Get Pro — $4.99</button>
          </div>
        </div>
      </section>

      {/* ── League Setup CTA ── */}
      <section style={{
        maxWidth: SECTION_MAX, margin: "0 auto", padding: "0 24px 60px",
      }}>
        <div style={{
          background: "#161b22", borderRadius: 12, border: "1px solid #21262d",
          padding: 32, textAlign: "center",
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#e6edf3", marginBottom: 8, marginTop: 0 }}>
            Takes 30 seconds to set up.
          </h3>
          <p style={{ fontSize: 13, color: "#7d8590", marginBottom: 20, lineHeight: 1.5 }}>
            Pick your league size, scoring format, and draft position.<br />
            Depth Chart builds your board and strategy from there.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", maxWidth: 360, margin: "0 auto" }}>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 6,
                border: "1px solid #30363d", background: "#0d1117",
                color: "#e6edf3", fontSize: 13, outline: "none",
              }}
            />
            <button
              onClick={() => router.push("/draft")}
              style={{
              padding: "10px 20px", borderRadius: 6, border: "none",
              background: "#3fb950", color: "#000", fontSize: 13,
              fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            }}>Get started</button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        maxWidth: SECTION_MAX, margin: "0 auto", padding: "20px 24px 40px",
        textAlign: "center", fontSize: 11, color: "#30363d",
      }}>
        Depth Chart is not affiliated with ESPN, CBS Sports, or any fantasy platform.<br />
        Rankings are sourced from publicly available expert consensus data.<br />
        © 2026 Depth Chart · Built for people who hate losing.
      </footer>
    </div>
  );
}
