"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { PLAYERS } from "../players";

// ── Mock Data: Week 5 scenario ──────────────────────────────────────────
// User drafted with the draft board, now 4 weeks in

const MY_ROSTER = [
  {id:1,name:"Drake Maye",pos:"QB",team:"NE",bye:11,status:"healthy",pts:[22,18,26,21],proj:20.5},
  {id:2,name:"Bijan Robinson",pos:"RB",team:"ATL",bye:11,status:"healthy",pts:[28,24,19,31],proj:25.2},
  {id:3,name:"Omarion Hampton",pos:"RB",team:"LAC",bye:7,status:"healthy",pts:[16,21,14,18],proj:17.0},
  {id:4,name:"Bhayshul Tuten",pos:"RB",team:"JAX",bye:7,status:"injured",injury:"Hamstring — out 2-3 weeks",pts:[14,9,0,0],proj:0},
  {id:5,name:"Jaxon Smith-Njigba",pos:"WR",team:"SEA",bye:11,status:"healthy",pts:[24,19,22,17],proj:20.8},
  {id:6,name:"Emeka Egbuka",pos:"WR",team:"TB",bye:10,status:"healthy",pts:[13,16,11,19],proj:14.5},
  {id:7,name:"Terry McLaurin",pos:"WR",team:"WAS",bye:7,status:"healthy",pts:[11,14,18,12],proj:13.8},
  {id:8,name:"Luther Burden III",pos:"WR",team:"CHI",bye:10,status:"questionable",injury:"Groin — limited practice",pts:[8,0,12,10],proj:10.5},
  {id:9,name:"Trey McBride",pos:"TE",team:"ARI",bye:14,status:"healthy",pts:[18,14,21,16],proj:17.2},
  {id:10,name:"Cameron Dicker",pos:"K",team:"LAC",bye:7,status:"healthy",pts:[9,12,7,11],proj:9.5},
  {id:11,name:"Denver DEF",pos:"DEF",team:"DEN",bye:10,status:"healthy",pts:[8,12,4,10],proj:8.0},
  {id:12,name:"Rico Dowdle",pos:"RB",team:"PIT",bye:9,status:"healthy",pts:[6,4,11,8],proj:7.5},
  {id:13,name:"Wan'Dale Robinson",pos:"WR",team:"TEN",bye:9,status:"healthy",pts:[7,9,5,12],proj:8.2},
];

// Top waiver wire players (available in league)
const WAIVER_POOL = [
  {id:101,name:"Elijah Mitchell",pos:"RB",team:"LAC",bye:7,owned:22,proj:12.5,reason:"Hampton's handcuff — valuable bye week fill",trend:"up",rostered:false},
  {id:102,name:"Tyrone Tracy Jr.",pos:"RB",team:"NYG",bye:8,owned:35,proj:11.8,reason:"Seeing 14+ touches/game, RB2 upside on volume",trend:"up",rostered:false},
  {id:103,name:"De'Zhaun Stribling",pos:"WR",team:"SF",bye:8,owned:18,proj:10.2,reason:"Emerged as SF WR1 after Pearsall's injury — target hog",trend:"up",rostered:false},
  {id:104,name:"Chigoziem Okonkwo",pos:"TE",team:"TEN",bye:9,owned:28,proj:9.8,reason:"TE6 in points through 4 weeks — Ward connection",trend:"up",rostered:false},
  {id:105,name:"Matthew Golden",pos:"WR",team:"GB",bye:11,owned:41,proj:11.4,reason:"3 TDs in 4 games — deep threat emerging in Love offense",trend:"up",rostered:false},
  {id:106,name:"Braelon Allen",pos:"RB",team:"NYJ",bye:13,owned:30,proj:10.1,reason:"Hall's workload declining — Allen getting passing-down work",trend:"up",rostered:false},
  {id:107,name:"Pittsburgh DEF",pos:"DEF",team:"PIT",bye:9,owned:45,proj:10.0,reason:"Faces CAR Week 5, ATL Week 6 — top stream window",trend:"neutral",rostered:false},
  {id:108,name:"Jake Bates",pos:"K",team:"DET",bye:6,owned:31,proj:10.2,reason:"K3 through 4 weeks — DET offense generating FG chances",trend:"up",rostered:false},
  {id:109,name:"Tyler Allgeier",pos:"RB",team:"ARI",bye:14,owned:15,proj:8.5,reason:"Love's handcuff — stash if you have Love",trend:"neutral",rostered:false},
  {id:110,name:"Rashod Bateman",pos:"WR",team:"BAL",bye:13,owned:12,proj:8.0,reason:"Flowers missing time → Bateman seeing 8+ targets",trend:"up",rostered:false},
  {id:111,name:"Cedric Tillman",pos:"WR",team:"CLE",bye:11,owned:20,proj:9.1,reason:"Steady WR2 target share — safe floor play",trend:"neutral",rostered:false},
  {id:112,name:"Tank Bigsby",pos:"RB",team:"JAX",bye:7,owned:52,proj:13.5,reason:"Tuten's injury → Bigsby is the lead back for 2-3 weeks",trend:"up",rostered:false},
];

const RECOMMENDED_MOVES = [
  {
    urgency: "critical",
    add: "Tank Bigsby",
    drop: "Wan'Dale Robinson",
    reason: "Your RB3 Tuten is out 2-3 weeks. Bigsby is the direct replacement — he'll be the JAX lead back while Tuten is sidelined. Wan'Dale is your WR5 with a 8.2 projection. The positional need outweighs the depth.",
    faab: "$18-22",
  },
  {
    urgency: "high",
    add: "Tyrone Tracy Jr.",
    drop: "Rico Dowdle",
    reason: "Tracy is out-touching Dowdle and has more standalone value. Dowdle is your RB4 at 7.5 projected — Tracy projects at 11.8 with a rising snap share. Straight upgrade at the same roster slot.",
    faab: "$12-15",
  },
  {
    urgency: "medium",
    add: "Pittsburgh DEF",
    drop: "Denver DEF",
    reason: "Denver faces KC Week 5 (bad matchup). Pittsburgh faces CAR (great matchup). If you're streaming, this is the swap. But Denver's schedule softens Week 6 — you could hold if you have bench space.",
    faab: "$1",
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

const URGENCY_COLORS = {
  critical: { bg: "#f8514920", border: "#f85149", text: "#f85149", label: "CRITICAL" },
  high:     { bg: "#d2992220", border: "#d29922", text: "#d29922", label: "HIGH" },
  medium:   { bg: "#388bfd15", border: "#388bfd40", text: "#388bfd", label: "MEDIUM" },
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

function TrendArrow({ trend }) {
  if (trend === "up") return <span style={{ color: "#3fb950", fontSize: 12 }}>↑</span>;
  if (trend === "down") return <span style={{ color: "#f85149", fontSize: 12 }}>↓</span>;
  return <span style={{ color: "#484f58", fontSize: 12 }}>→</span>;
}

// ── Main Component ──────────────────────────────────────────────────────
export default function WaiverWire() {
  const [activeView, setActiveView] = useState("moves");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [myDraftedTeam, setMyDraftedTeam] = useState([]);
  const [rosterSearch, setRosterSearch] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  // Load roster from draft board via localStorage — re-reads on focus
  useEffect(() => {
    const loadRoster = () => {
      try {
        const saved = localStorage.getItem("depthchart-myteam");
        if (saved) setMyDraftedTeam(JSON.parse(saved));
      } catch {}
    };
    loadRoster();
    window.addEventListener("focus", loadRoster);
    return () => window.removeEventListener("focus", loadRoster);
  }, []);

  const rosterByPos = useMemo(() => {
    const groups = {};
    MY_ROSTER.forEach(p => {
      if (!groups[p.pos]) groups[p.pos] = [];
      groups[p.pos].push(p);
    });
    return groups;
  }, []);

  const rosterNeeds = useMemo(() => {
    const needs = [];
    const injured = MY_ROSTER.filter(p => p.status === "injured");
    if (injured.length) needs.push({ type: "injury", label: `${injured.length} player${injured.length > 1 ? "s" : ""} injured`, severity: "critical" });
    const byeWeek5 = MY_ROSTER.filter(p => p.bye === 5);
    if (byeWeek5.length) needs.push({ type: "bye", label: `${byeWeek5.length} on bye this week`, severity: "high" });
    const rbs = MY_ROSTER.filter(p => p.pos === "RB" && p.status === "healthy");
    if (rbs.length < 3) needs.push({ type: "depth", label: "RB depth thin", severity: "high" });
    return needs;
  }, []);

  const sendChat = useCallback(async (userMsg) => {
    if (!userMsg.trim()) return;
    const newMsgs = [...chatMessages, { role: "user", text: userMsg }];
    setChatMessages(newMsgs);
    setChatInput("");
    setChatLoading(true);

    // Use real roster from draft board if available
    const myDraftedRosterStr = myDraftedTeam.length > 0
      ? myDraftedTeam.map(p => `${p.name} (${p.pos}, ${p.team}, Bye: ${p.bye})`).join("\n")
      : null;
    const rosterStr = MY_ROSTER.map(p =>
      `${p.name} (${p.pos}, ${p.team}, ${p.status}${p.injury ? ": " + p.injury : ""}, proj: ${p.proj})`
    ).join("\n");
    const waiverStr = WAIVER_POOL.slice(0, 12).map(p =>
      `${p.name} (${p.pos}, ${p.team}, ${p.owned}% owned, proj: ${p.proj}) — ${p.reason}`
    ).join("\n");
    const movesStr = RECOMMENDED_MOVES.map(m =>
      `[${m.urgency}] Add ${m.add}, Drop ${m.drop} — ${m.reason}`
    ).join("\n");

    const systemPrompt = `You are Depth Chart GM — a fantasy football waiver wire and trade advisor embedded in a live GM dashboard. Today's date is September 2026. The 2026 NFL season is underway.

CRITICAL DATA RULES:
- It is the 2026 NFL season. Players drafted in the 2025 NFL Draft are in their SECOND year, not rookies.
- Players drafted in the 2026 NFL Draft are the actual rookies.
- If you are unsure about a player's current team, injury status, waiver availability, or any recent news — use web search. Do NOT guess.
- Always verify injury timelines and player roles before making add/drop recommendations.

ADVISOR PERSONALITY:
- Be direct, opinionated, and concise. Challenge bad ideas, confirm good ones fast.
- Never break character. Never discuss how the app works, APIs, or data sources. You are a GM, period.
- If asked about non-fantasy-football topics, redirect: "I'm your GM advisor — let's stay focused on your roster."

LEAGUE: 12-team, Full PPR, ESPN
${myDraftedRosterStr ? `
MY DRAFTED TEAM:
${myDraftedRosterStr}
` : ""}
MY ROSTER:
${rosterStr}

TOP WAIVER WIRE AVAILABLE:
${waiverStr}

RECOMMENDED MOVES:
${movesStr}

KEY CONTEXT:
- Tuten (RB3) is out 2-3 weeks with a hamstring
- Burden (WR4) is questionable with a groin issue
- Hampton and Dicker both on bye Week 7 — plan ahead
- FAAB budget remaining: $78 of $100

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

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif",
      maxWidth: 692, margin: "0 auto", minHeight: "100vh",
      background: "#090b10", color: "#c9d1d9",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 14px 10px", borderBottom: "2px solid #58a6ff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#e6edf3" }}>Depth Chart</span>
              <span style={{ fontSize: 11, color: "#58a6ff", fontWeight: 700 }}>GM</span>
            </div>
            <div style={{ fontSize: 11, color: "#484f58", marginTop: 1 }}>Waiver Wire · Week 5 · FAAB: $78 remaining</div>
          </div>
          <div style={{
            padding: "4px 10px", borderRadius: 6, background: "#161b22",
            border: "1px solid #21262d", fontSize: 11, color: "#7d8590",
          }}>
            Waivers process: <span style={{ color: "#3fb950", fontWeight: 700 }}>Tue 3am</span>
          </div>
        </div>

        {/* Roster needs alerts */}
        {rosterNeeds.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {rosterNeeds.map((n, i) => (
              <span key={i} style={{
                padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                background: n.severity === "critical" ? "#f8514920" : "#d2992220",
                color: n.severity === "critical" ? "#f85149" : "#d29922",
                border: `1px solid ${n.severity === "critical" ? "#f8514940" : "#d2992240"}`,
              }}>{n.label}</span>
            ))}
          </div>
        )}
      </div>

      {/* View tabs */}
      <div style={{
        display: "flex", gap: 2, padding: "6px 10px",
        background: "#0d1117", borderBottom: "1px solid #161b22",
      }}>
        {[
          { key: "moves", label: "Recommended Moves" },
          { key: "wire", label: "Waiver Wire" },
          { key: "roster", label: "My Roster" },
          { key: "chat", label: "Ask GM" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveView(tab.key)} style={{
            padding: "5px 10px", border: "none", borderRadius: 6, fontSize: 11,
            fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            background: activeView === tab.key ? "#58a6ff" : "transparent",
            color: activeView === tab.key ? "#fff" : "#484f58",
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Recommended Moves ── */}
      {activeView === "moves" && (
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: "#484f58", marginBottom: 12, lineHeight: 1.5 }}>
            Based on your roster gaps, injury situation, and what's available on waivers.
          </div>

          {RECOMMENDED_MOVES.map((move, i) => {
            const uc = URGENCY_COLORS[move.urgency];
            return (
              <div key={i} style={{
                background: "#0d1117", borderRadius: 10,
                border: `1px solid ${uc.border}`, marginBottom: 12,
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "6px 12px", background: uc.bg,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: uc.text, letterSpacing: 0.5 }}>
                    {uc.label}
                  </span>
                  <span style={{ fontSize: 10, color: "#484f58" }}>Suggested FAAB: {move.faab}</span>
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                      <span style={{ fontSize: 10, color: "#3fb950", fontWeight: 700 }}>ADD</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3" }}>{move.add}</span>
                    </div>
                    <div style={{ fontSize: 16, color: "#484f58" }}>⇄</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#7d8590", textDecoration: "line-through", opacity: 0.7 }}>{move.drop}</span>
                      <span style={{ fontSize: 10, color: "#f85149", fontWeight: 700 }}>DROP</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#7d8590", lineHeight: 1.5 }}>{move.reason}</div>
                </div>
              </div>
            );
          })}

          <div style={{
            textAlign: "center", padding: 16, fontSize: 12, color: "#484f58",
            borderTop: "1px solid #161b22", marginTop: 8,
          }}>
            Not sure about a move? Hit the <span style={{ color: "#58a6ff", fontWeight: 600 }}>Ask GM</span> tab to talk it through.
          </div>
        </div>
      )}

      {/* ── Waiver Wire Pool ── */}
      {activeView === "wire" && (
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: "#484f58", marginBottom: 10 }}>
            Sorted by relevance to your roster needs. Ownership % is league-wide.
          </div>
          {WAIVER_POOL.map(p => (
            <div key={p.id} style={{
              background: "#0d1117", borderRadius: 8, border: "1px solid #161b22",
              padding: "10px 12px", marginBottom: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PosBadge pos={p.pos} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>
                  {p.name}
                  <TrendArrow trend={p.trend} />
                </span>
                <span style={{ fontSize: 10, color: "#484f58" }}>{p.team}</span>
                <span style={{ fontSize: 10, color: "#484f58" }}>{p.owned}% owned</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#58a6ff" }}>{p.proj}</span>
              </div>
              <div style={{ fontSize: 11, color: "#7d8590", marginTop: 4, lineHeight: 1.4 }}>
                {p.reason}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── My Roster ── */}
      {activeView === "roster" && (
        <div style={{ padding: 14 }}>
          {/* Add Player Search */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#58a6ff", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              {pendingAction ? (pendingAction.type === "trade" ? `Trade away ${pendingAction.player.name} — who are you getting?` : `Replacing ${pendingAction.player.name} — add who?`) : "Add Player"}
            </div>
            <input
              value={rosterSearch}
              onChange={e => setRosterSearch(e.target.value)}
              placeholder="Search player to add..."
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #21262d",
                background: "#0d1117", color: "#e6edf3", fontSize: 13, outline: "none", boxSizing: "border-box",
              }}
            />
            {rosterSearch.trim() && (
              <div style={{ maxHeight: 160, overflowY: "auto", marginTop: 4, borderRadius: 6, border: "1px solid #21262d", background: "#0d1117" }}>
                {PLAYERS
                  .filter(p => !myDraftedTeam.some(tp => tp.id === p.id))
                  .filter(p => p.name.toLowerCase().includes(rosterSearch.toLowerCase()) || p.team.toLowerCase().includes(rosterSearch.toLowerCase()))
                  .slice(0, 8)
                  .map(p => (
                    <div key={p.id} onClick={() => {
                      const updated = [...myDraftedTeam, p];
                      setMyDraftedTeam(updated);
                      localStorage.setItem("depthchart-myteam", JSON.stringify(updated));
                      setRosterSearch("");
                      setPendingAction(null);
                    }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", cursor: "pointer",
                        borderBottom: "1px solid #161b22", transition: "background 0.1s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#161b22"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <PosBadge pos={p.pos} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#e6edf3" }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: "#484f58" }}>{p.team}</span>
                      <span style={{ fontSize: 11, color: "#3fb950", fontWeight: 700 }}>+ Add</span>
                    </div>
                  ))}
                {PLAYERS.filter(p => !myDraftedTeam.some(tp => tp.id === p.id)).filter(p => p.name.toLowerCase().includes(rosterSearch.toLowerCase()) || p.team.toLowerCase().includes(rosterSearch.toLowerCase())).length === 0 && (
                  <div style={{ padding: "8px 10px", fontSize: 12, color: "#484f58" }}>No matching players found</div>
                )}
              </div>
            )}
            {pendingAction && (
              <button onClick={() => { setPendingAction(null); setRosterSearch(""); }} style={{
                marginTop: 6, padding: "4px 10px", borderRadius: 4, border: "1px solid #21262d",
                background: "transparent", color: "#484f58", fontSize: 11, cursor: "pointer",
              }}>Cancel</button>
            )}
          </div>

          {/* Roster list */}
          {myDraftedTeam.length === 0 ? (
            <div style={{ fontSize: 13, color: "#484f58", textAlign: "center", padding: 32 }}>
              No roster found. Draft players on the Draft Board first, or add players above.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "#484f58", marginBottom: 8 }}>{myDraftedTeam.length} players</div>
              {["QB","RB","WR","TE","K","DEF"].map(pos => {
                const posPlayers = myDraftedTeam.filter(p => p.pos === pos);
                if (posPlayers.length === 0) return null;
                return (
                  <div key={pos} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#484f58", marginBottom: 6 }}>{pos}</div>
                    {posPlayers.map(p => (
                      <div key={p.id} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                        background: "#0d1117", borderRadius: 6, marginBottom: 4,
                        border: "1px solid #161b22",
                      }}>
                        <PosBadge pos={p.pos} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>{p.name}</div>
                        </div>
                        <span style={{ fontSize: 10, color: "#484f58" }}>{p.team}</span>
                        <button onClick={() => {
                          setPendingAction({ type: "trade", player: p });
                          const updated = myDraftedTeam.filter(tp => tp.id !== p.id);
                          setMyDraftedTeam(updated);
                          localStorage.setItem("depthchart-myteam", JSON.stringify(updated));
                          setRosterSearch("");
                        }} style={{
                          padding: "3px 8px", borderRadius: 4, border: "none", fontSize: 10, fontWeight: 700,
                          background: "#58a6ff", color: "#000", cursor: "pointer",
                        }}>Trade</button>
                        <button onClick={() => {
                          setPendingAction({ type: "drop", player: p });
                          const updated = myDraftedTeam.filter(tp => tp.id !== p.id);
                          setMyDraftedTeam(updated);
                          localStorage.setItem("depthchart-myteam", JSON.stringify(updated));
                          setRosterSearch("");
                        }} style={{
                          padding: "3px 8px", borderRadius: 4, border: "none", fontSize: 10, fontWeight: 700,
                          background: "#f85149", color: "#fff", cursor: "pointer",
                        }}>Drop</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── Ask GM Chat ── */}
      {activeView === "chat" && (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 10 }}>
            {chatMessages.length === 0 && (
              <div style={{ padding: "20px 0" }}>
                <div style={{ fontSize: 13, color: "#484f58", marginBottom: 16, lineHeight: 1.5 }}>
                  Ask me anything about your roster, waivers, or upcoming matchups.
                </div>
                {[
                  "Should I blow my FAAB on Bigsby?",
                  "Who do I drop for an RB — Wan'Dale or Burden?",
                  "Is Tracy worth a #2 waiver priority?",
                  "Should I stream DEF or hold Denver?",
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
                  background: m.role === "user" ? "#58a6ff" : "#0d1117",
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
              placeholder="Ask about a move..."
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
                background: chatLoading || !chatInput.trim() ? "#161b22" : "#58a6ff",
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
