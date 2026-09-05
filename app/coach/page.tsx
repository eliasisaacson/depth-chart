"use client";
import { useState, useCallback } from "react";

// ── Week 5 Matchup Data ─────────────────────────────────────────────────
// Same roster as GM screen, now deciding who to start

const LINEUP = {
  starters: [
    {id:1,name:"Drake Maye",pos:"QB",team:"NE",opp:"@BUF",oppRk:18,proj:19.2,floor:14,ceil:28,status:"healthy",note:"BUF allows 5th most pass yds at home",verdict:"start",confidence:82},
    {id:2,name:"Bijan Robinson",pos:"RB",team:"ATL",opp:"vs DET",oppRk:22,proj:24.8,floor:18,ceil:34,status:"healthy",note:"DET allows 3rd most RB receptions",verdict:"must-start",confidence:97},
    {id:3,name:"Omarion Hampton",pos:"RB",team:"LAC",opp:"vs ARI",oppRk:28,proj:18.5,floor:13,ceil:26,status:"healthy",note:"ARI run D ranks 28th — smash spot",verdict:"start",confidence:88},
    {id:5,name:"Jaxon Smith-Njigba",pos:"WR",team:"SEA",opp:"@NYJ",oppRk:4,proj:16.2,floor:10,ceil:24,status:"healthy",note:"NYJ secondary is elite but JSN runs slot — Sauce plays outside",verdict:"start",confidence:76},
    {id:6,name:"Emeka Egbuka",pos:"WR",team:"TB",opp:"vs CHI",oppRk:14,proj:14.0,floor:9,ceil:22,status:"healthy",note:"Neutral matchup — Egbuka's target share is steady",verdict:"start",confidence:71},
    {id:9,name:"Trey McBride",pos:"TE",team:"ARI",opp:"@LAC",oppRk:20,proj:16.8,floor:11,ceil:24,status:"healthy",note:"LAC allows TE receptions at 6th highest rate",verdict:"start",confidence:85},
    {id:7,name:"Terry McLaurin",pos:"WR",team:"WAS",opp:"vs CLE",oppRk:6,proj:12.4,floor:7,ceil:21,status:"healthy",note:"CLE has 2nd most INTs — Daniels may check down more",verdict:"flex",confidence:62},
    {id:10,name:"Cameron Dicker",pos:"K",team:"LAC",opp:"vs ARI",oppRk:0,proj:9.5,floor:5,ceil:14,status:"healthy",note:"LAC offense should move the ball — expect FG chances",verdict:"start",confidence:70},
    {id:11,name:"Denver DEF",pos:"DEF",team:"DEN",opp:"@KC",oppRk:0,proj:5.2,floor:1,ceil:10,status:"healthy",note:"KC offense limited but at Arrowhead — low ceiling",verdict:"sit",confidence:40},
  ],
  bench: [
    {id:4,name:"Bhayshul Tuten",pos:"RB",team:"JAX",opp:"vs MIA",oppRk:0,proj:0,floor:0,ceil:0,status:"injured",injury:"Hamstring — out 2-3 weeks",verdict:"cant-play",confidence:0},
    {id:8,name:"Luther Burden III",pos:"WR",team:"CHI",opp:"@TB",oppRk:19,proj:11.2,floor:5,ceil:19,status:"questionable",injury:"Groin — limited practice",note:"If active, TB allows WR points at above-average rate",verdict:"risky-start",confidence:48},
    {id:12,name:"Rico Dowdle",pos:"RB",team:"PIT",opp:"vs DAL",oppRk:12,proj:8.8,floor:4,ceil:15,status:"healthy",note:"DAL run D is average — Dowdle's floor is low in timeshare",verdict:"sit",confidence:35},
    {id:13,name:"Wan'Dale Robinson",pos:"WR",team:"TEN",opp:"@MIN",oppRk:3,proj:7.5,floor:3,ceil:14,status:"healthy",note:"MIN defense is top 3 vs WR — bad week for Wan'Dale",verdict:"sit",confidence:25},
  ],
};

const DECISIONS = [
  {
    type: "lineup-alert",
    urgency: "critical",
    title: "Stream a defense — sit Denver",
    detail: "Denver projects at 5.2 against KC at Arrowhead. If Pittsburgh DEF is on waivers (they face CAR), grab them. Even without a stream, any top-12 matchup defense outscores Denver this week.",
  },
  {
    type: "flex-debate",
    urgency: "high",
    title: "Flex: McLaurin vs Burden vs Dowdle",
    detail: "McLaurin is the safe play despite Cleveland's secondary — his target floor is 6+. Burden has higher upside if active (TB matchup is juicy) but the groin makes him a game-time decision. Dowdle's ceiling is too low in a timeshare. Go McLaurin unless Burden is a full participant Friday.",
  },
  {
    type: "matchup-exploit",
    urgency: "medium",
    title: "Hampton is a top-5 play this week",
    detail: "Arizona's run defense ranks 28th in yards allowed and 30th in fantasy points to RBs. Hampton should see 20+ touches with goal-line work. This is a ceiling game — don't overthink it.",
  },
];

const POS_COLORS = {
  QB: { bg: "#fce4ec", text: "#c62828" },
  RB: { bg: "#e3f2fd", text: "#1565c0" },
  WR: { bg: "#e8f5e9", text: "#2e7d32" },
  TE: { bg: "#fff3e0", text: "#e65100" },
  K:  { bg: "#f3e5f5", text: "#6a1b9a" },
  DEF:{ bg: "#eceff1", text: "#37474f" },
};

const VERDICT_STYLE = {
  "must-start": { color: "#3fb950", label: "MUST START" },
  "start":      { color: "#3fb950", label: "START" },
  "flex":       { color: "#58a6ff", label: "FLEX" },
  "risky-start":{ color: "#d29922", label: "RISKY START" },
  "sit":        { color: "#f85149", label: "SIT" },
  "cant-play":  { color: "#484f58", label: "OUT" },
};

const URGENCY_COLORS = {
  critical: { bg: "#f8514920", border: "#f85149", text: "#f85149" },
  high:     { bg: "#d2992220", border: "#d29922", text: "#d29922" },
  medium:   { bg: "#388bfd15", border: "#388bfd40", text: "#388bfd" },
};

function PosBadge({ pos }) {
  const c = POS_COLORS[pos] || { bg: "#eee", text: "#333" };
  return (
    <span style={{
      display: "inline-block", padding: "1px 6px", borderRadius: 4, fontSize: 10,
      fontWeight: 700, background: c.bg, color: c.text, minWidth: 26, textAlign: "center",
    }}>{pos}</span>
  );
}

function ConfidenceBar({ value }) {
  const color = value >= 75 ? "#3fb950" : value >= 50 ? "#d29922" : "#f85149";
  return (
    <div style={{ width: 40, height: 4, borderRadius: 2, background: "#21262d", overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", borderRadius: 2, background: color }} />
    </div>
  );
}

function ProjectionBar({ floor, proj, ceil }) {
  const max = Math.max(ceil, 35);
  const floorPct = (floor / max) * 100;
  const projPct = (proj / max) * 100;
  const ceilPct = (ceil / max) * 100;
  return (
    <div style={{ position: "relative", width: "100%", height: 8, marginTop: 4 }}>
      {/* Range bar */}
      <div style={{
        position: "absolute", top: 2, height: 4, borderRadius: 2,
        left: `${floorPct}%`, width: `${ceilPct - floorPct}%`,
        background: "#21262d",
      }} />
      {/* Projection dot */}
      {proj > 0 && <div style={{
        position: "absolute", top: 0, width: 8, height: 8, borderRadius: "50%",
        background: "#58a6ff", left: `calc(${projPct}% - 4px)`,
      }} />}
      {/* Labels */}
      <div style={{ position: "absolute", top: 10, left: `${floorPct}%`, fontSize: 8, color: "#484f58" }}>{floor}</div>
      <div style={{ position: "absolute", top: 10, left: `calc(${ceilPct}% - 8px)`, fontSize: 8, color: "#484f58" }}>{ceil}</div>
    </div>
  );
}

function PlayerCard({ player, isStarter }) {
  const v = VERDICT_STYLE[player.verdict] || { color: "#484f58", label: "—" };
  const isDead = player.verdict === "cant-play";

  return (
    <div style={{
      background: "#0d1117", borderRadius: 8, border: "1px solid #161b22",
      padding: "10px 12px", marginBottom: 6, opacity: isDead ? 0.45 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PosBadge pos={player.pos} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>{player.name}</span>
            {player.status === "injured" && <span style={{ fontSize: 9, fontWeight: 800, padding: "0 4px", borderRadius: 3, background: "#f85149", color: "#fff" }}>OUT</span>}
            {player.status === "questionable" && <span style={{ fontSize: 9, fontWeight: 800, padding: "0 4px", borderRadius: 3, background: "#d29922", color: "#000" }}>Q</span>}
          </div>
          <div style={{ fontSize: 10, color: "#484f58", marginTop: 1 }}>
            {player.team} {player.opp}
            {player.oppRk > 0 && <span> · Opp {player.pos} rank: <span style={{ color: player.oppRk >= 20 ? "#3fb950" : player.oppRk <= 8 ? "#f85149" : "#d29922", fontWeight: 600 }}>#{player.oppRk}</span></span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: v.color }}>{v.label}</span>
          {player.confidence > 0 && (
            <div style={{ marginTop: 3 }}>
              <ConfidenceBar value={player.confidence} />
            </div>
          )}
        </div>
      </div>

      {!isDead && (
        <>
          <ProjectionBar floor={player.floor} proj={player.proj} ceil={player.ceil} />
          <div style={{ fontSize: 11, color: "#7d8590", marginTop: 10, lineHeight: 1.4 }}>
            {player.note}
          </div>
        </>
      )}
      {player.injury && (
        <div style={{ fontSize: 10, color: "#f85149", marginTop: 4 }}>{player.injury}</div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────
export default function CoachView() {
  const [activeView, setActiveView] = useState("decisions");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const sendChat = useCallback(async (userMsg) => {
    if (!userMsg.trim()) return;
    const newMsgs = [...chatMessages, { role: "user", text: userMsg }];
    setChatMessages(newMsgs);
    setChatInput("");
    setChatLoading(true);

    const allPlayers = [...LINEUP.starters, ...LINEUP.bench];
    const rosterStr = allPlayers.map(p =>
      `${p.name} (${p.pos}, ${p.team} ${p.opp}, proj:${p.proj}, floor:${p.floor}, ceil:${p.ceil}, oppRk:${p.oppRk}, status:${p.status}${p.injury ? " — "+p.injury : ""}, verdict:${p.verdict})`
    ).join("\n");
    const decisionsStr = DECISIONS.map(d =>
      `[${d.urgency}] ${d.title}: ${d.detail}`
    ).join("\n");

    const systemPrompt = `You are Depth Chart Coach, a fantasy football lineup advisor. It's Week 5 of the 2026 NFL season. Be direct, opinionated, concise. Give the answer first, then the reason.

LEAGUE: 12-team, Full PPR, ESPN

ROSTER & MATCHUPS:
${rosterStr}

KEY DECISIONS THIS WEEK:
${decisionsStr}

CONTEXT:
- Tuten is OUT (hamstring)
- Burden is QUESTIONABLE (groin) — game-time decision
- Denver DEF has a terrible matchup @ KC
- McLaurin is in the FLEX spot currently
- Opponent this week is projected at 118 points (close matchup)

Advice style: When the matchup is close, lean ceiling over floor. When you're favored, play the floor. This week is close.

Keep responses under 150 words. No bullet points.`;

    const apiMessages = newMsgs.map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    try {
      const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    system: systemPrompt,
    messages: apiMessages,
        }),
      });
      const data = await response.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Couldn't get a response.";
      setChatMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Connection error — try again." }]);
    }
    setChatLoading(false);
  }, [chatMessages]);

  // Compute projected total
  const projTotal = LINEUP.starters.reduce((sum, p) => sum + p.proj, 0).toFixed(1);
  const floorTotal = LINEUP.starters.reduce((sum, p) => sum + p.floor, 0);
  const ceilTotal = LINEUP.starters.reduce((sum, p) => sum + p.ceil, 0);

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif",
      maxWidth: 520, margin: "0 auto", minHeight: "100vh",
      background: "#090b10", color: "#c9d1d9",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 14px 10px", borderBottom: "2px solid #3fb950" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#e6edf3" }}>Depth Chart</span>
              <span style={{ fontSize: 11, color: "#3fb950", fontWeight: 700 }}>COACH</span>
            </div>
            <div style={{ fontSize: 11, color: "#484f58", marginTop: 1 }}>Lineup Optimizer · Week 5</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#484f58" }}>Projected</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#e6edf3" }}>{projTotal}</div>
            <div style={{ fontSize: 9, color: "#484f58" }}>{floorTotal} floor · {ceilTotal} ceil</div>
          </div>
        </div>

        {/* Matchup bar */}
        <div style={{
          marginTop: 10, padding: "6px 10px", borderRadius: 6,
          background: "#0d1117", border: "1px solid #161b22",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 11,
        }}>
          <div>
            <span style={{ color: "#e6edf3", fontWeight: 700 }}>Your team</span>
            <span style={{ color: "#3fb950", fontWeight: 700, marginLeft: 8 }}>{projTotal}</span>
          </div>
          <div style={{ color: "#484f58" }}>vs</div>
          <div>
            <span style={{ color: "#f85149", fontWeight: 700, marginRight: 8 }}>118.0</span>
            <span style={{ color: "#7d8590", fontWeight: 600 }}>Team_McMuffin</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 2, padding: "6px 10px",
        background: "#0d1117", borderBottom: "1px solid #161b22",
      }}>
        {[
          { key: "decisions", label: "This Week" },
          { key: "starters", label: "Starters" },
          { key: "bench", label: "Bench" },
          { key: "chat", label: "Ask Coach" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveView(tab.key)} style={{
            padding: "5px 10px", border: "none", borderRadius: 6, fontSize: 11,
            fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            background: activeView === tab.key ? "#3fb950" : "transparent",
            color: activeView === tab.key ? "#000" : "#484f58",
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── This Week Decisions ── */}
      {activeView === "decisions" && (
        <div style={{ padding: 14 }}>
          {DECISIONS.map((d, i) => {
            const uc = URGENCY_COLORS[d.urgency];
            return (
              <div key={i} style={{
                background: "#0d1117", borderRadius: 10,
                border: `1px solid ${uc.border}`, marginBottom: 12, overflow: "hidden",
              }}>
                <div style={{
                  padding: "6px 12px", background: uc.bg,
                  fontSize: 10, fontWeight: 800, color: uc.text, letterSpacing: 0.5,
                }}>
                  {d.urgency.toUpperCase()} · {d.type.replace("-", " ").toUpperCase()}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3", marginBottom: 6 }}>
                    {d.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#7d8590", lineHeight: 1.5 }}>
                    {d.detail}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick matchup ratings */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#484f58", marginBottom: 8 }}>Starter matchup ratings</div>
            {LINEUP.starters.filter(p => p.pos !== "K" && p.pos !== "DEF" && p.proj > 0).map(p => {
              const quality = p.oppRk >= 20 ? "smash" : p.oppRk >= 13 ? "neutral" : "tough";
              const qColor = quality === "smash" ? "#3fb950" : quality === "neutral" ? "#d29922" : "#f85149";
              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "5px 10px",
                  background: "#0d1117", borderRadius: 6, marginBottom: 3,
                  borderLeft: `3px solid ${qColor}`,
                }}>
                  <PosBadge pos={p.pos} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#c9d1d9" }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: "#484f58" }}>{p.opp}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: qColor }}>
                    {quality === "smash" ? "☀ Smash" : quality === "neutral" ? "→ Neutral" : "☁ Tough"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Starters ── */}
      {activeView === "starters" && (
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: "#484f58", marginBottom: 10 }}>
            Projection ranges show floor (left) to ceiling (right). Blue dot is projected score.
          </div>
          {LINEUP.starters.map(p => (
            <PlayerCard key={p.id} player={p} isStarter={true} />
          ))}
        </div>
      )}

      {/* ── Bench ── */}
      {activeView === "bench" && (
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: "#484f58", marginBottom: 10 }}>
            Players on your bench with their start/sit verdict if swapped in.
          </div>
          {LINEUP.bench.map(p => (
            <PlayerCard key={p.id} player={p} isStarter={false} />
          ))}
        </div>
      )}

      {/* ── Ask Coach Chat ── */}
      {activeView === "chat" && (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 10 }}>
            {chatMessages.length === 0 && (
              <div style={{ padding: "20px 0" }}>
                <div style={{ fontSize: 13, color: "#484f58", marginBottom: 16, lineHeight: 1.5 }}>
                  Ask me about your lineup, matchups, or start/sit decisions.
                </div>
                {[
                  "McLaurin or Burden in the flex?",
                  "Should I sit Denver DEF and stream?",
                  "Is this a ceiling week or a floor week?",
                  "Any sneaky bench plays I'm missing?",
                  "Would you start Dowdle over McLaurin?",
                ].map((q, i) => (
                  <button key={i} onClick={() => sendChat(q)} style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "8px 12px", marginBottom: 6, borderRadius: 8,
                    background: "#0d1117", border: "1px solid #21262d",
                    color: "#7d8590", fontSize: 12, cursor: "pointer",
                  }}>{q}</button>
                ))}
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} style={{
                marginBottom: 8, display: "flex", flexDirection: "column",
                alignItems: m.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  padding: "8px 12px", borderRadius: 10, maxWidth: "88%",
                  fontSize: 13, lineHeight: 1.5,
                  background: m.role === "user" ? "#3fb950" : "#0d1117",
                  color: m.role === "user" ? "#000" : "#c9d1d9",
                  border: m.role === "user" ? "none" : "1px solid #21262d",
                }}>{m.text}</div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ padding: "8px 12px", fontSize: 12, color: "#484f58", fontStyle: "italic" }}>
                Thinking...
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !chatLoading) sendChat(chatInput); }}
              placeholder="Ask about your lineup..."
              disabled={chatLoading}
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 8,
                border: "1px solid #21262d", background: "#0d1117",
                color: "#e6edf3", fontSize: 13, outline: "none",
              }}
            />
            <button
              onClick={() => sendChat(chatInput)}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                padding: "10px 16px", borderRadius: 8, border: "none",
                fontWeight: 700, fontSize: 13,
                background: chatLoading || !chatInput.trim() ? "#161b22" : "#3fb950",
                color: chatLoading || !chatInput.trim() ? "#484f58" : "#000",
                cursor: chatLoading || !chatInput.trim() ? "default" : "pointer",
              }}
            >Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
