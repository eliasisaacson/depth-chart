"use client";
import { useState, useCallback, useEffect, useMemo } from "react";

const POS_COLORS = {
  QB: { bg: "#fce4ec", text: "#c62828" },
  RB: { bg: "#e3f2fd", text: "#1565c0" },
  WR: { bg: "#e8f5e9", text: "#2e7d32" },
  TE: { bg: "#fff3e0", text: "#e65100" },
  K:  { bg: "#f3e5f5", text: "#6a1b9a" },
  DEF:{ bg: "#eceff1", text: "#37474f" },
};

const STARTER_SLOTS = [
  { key: "QB", label: "QB", eligible: ["QB"] },
  { key: "RB1", label: "RB1", eligible: ["RB"] },
  { key: "RB2", label: "RB2", eligible: ["RB"] },
  { key: "WR1", label: "WR1", eligible: ["WR"] },
  { key: "WR2", label: "WR2", eligible: ["WR"] },
  { key: "TE", label: "TE", eligible: ["TE"] },
  { key: "FLEX", label: "FLEX", eligible: ["RB", "WR", "TE"] },
  { key: "K", label: "K", eligible: ["K"] },
  { key: "DEF", label: "DEF", eligible: ["DEF"] },
];

const VERDICT_STYLE = {
  "MUST START": { color: "#3fb950" },
  "START":      { color: "#3fb950" },
  "FLEX":       { color: "#58a6ff" },
  "SIT":        { color: "#f85149" },
  "BENCH":      { color: "#f85149" },
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

// Auto-assign players to starting slots in draft order
function autoAssignLineup(players) {
  const lineup = {};
  const used = new Set();

  // Go through players in draft order and assign to first open eligible slot
  for (const player of players) {
    let assigned = false;

    // First try to fill primary position slots (QB, RB1, RB2, WR1, WR2, TE, K, DEF)
    for (const slot of STARTER_SLOTS) {
      if (slot.key === "FLEX") continue; // Fill flex after primary slots
      if (lineup[slot.key]) continue; // Slot already filled
      if (!slot.eligible.includes(player.pos)) continue; // Wrong position
      lineup[slot.key] = player;
      used.add(player.id);
      assigned = true;
      break;
    }

    // If not assigned to a primary slot, try flex
    if (!assigned && !lineup["FLEX"] && ["RB", "WR", "TE"].includes(player.pos)) {
      lineup["FLEX"] = player;
      used.add(player.id);
    }
  }

  const bench = players.filter(p => !used.has(p.id));
  return { lineup, bench };
}

export default function CoachView() {
  const [activeView, setActiveView] = useState("lineup");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [myTeam, setMyTeam] = useState([]);
  const [lineup, setLineup] = useState({});
  const [bench, setBench] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [hasRecommendation, setHasRecommendation] = useState(false);

  // Load roster and lineup from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem("depthchart-myteam");
        if (saved) {
          const team = JSON.parse(saved);
          setMyTeam(team);
          const teamIds = new Set(team.map(p => p.id));

          // Load saved lineup or auto-assign
          const savedLineup = localStorage.getItem("depthchart-lineup");
          if (savedLineup) {
            const parsed = JSON.parse(savedLineup);
            const existingLineup = parsed.lineup || {};
            const existingBench = parsed.bench || [];

            // Remove players no longer on team from lineup
            const cleanedLineup = {};
            const usedIds = new Set();
            for (const [slot, player] of Object.entries(existingLineup)) {
              if (player && teamIds.has(player.id)) {
                cleanedLineup[slot] = player;
                usedIds.add(player.id);
              } else {
                cleanedLineup[slot] = null;
              }
            }

            // Remove players no longer on team from bench, keep the rest
            const cleanedBench = existingBench.filter(p => teamIds.has(p.id));
            cleanedBench.forEach(p => usedIds.add(p.id));

            // Add any new players (from draft/GM) to bench
            const newPlayers = team.filter(p => !usedIds.has(p.id));
            const finalBench = [...cleanedBench, ...newPlayers];

            setLineup(cleanedLineup);
            setBench(finalBench);
          } else {
            const { lineup: auto, bench: autoBench } = autoAssignLineup(team);
            setLineup(auto);
            setBench(autoBench);
          }
        }
      } catch {}
      // Load cached analysis
      try {
        const cachedAnalysis = localStorage.getItem("depthchart-coach-analysis");
        const cachedTime = localStorage.getItem("depthchart-coach-timestamp");
        if (cachedAnalysis) {
          setAnalysis(JSON.parse(cachedAnalysis));
          if (cachedTime) setLastRefreshed(cachedTime);
        }
      } catch {}
    };
    loadData();
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, []);

  // Save lineup whenever it changes
  const saveLineup = useCallback((newLineup, newBench) => {
    setLineup(newLineup);
    setBench(newBench);
    localStorage.setItem("depthchart-lineup", JSON.stringify({ lineup: newLineup, bench: newBench }));
  }, []);

  // Refresh matchup analysis
  const refreshAnalysis = useCallback(async () => {
    if (myTeam.length === 0) return;
    setAnalysisLoading(true);

    const rosterStr = myTeam.map(p => `${p.name} (${p.pos}, ${p.team}, Bye: ${p.bye})`).join("\n");

    // Build current lineup string
    const lineupStr = STARTER_SLOTS.map(slot => {
      const p = lineup[slot.key];
      return p ? `${slot.label}: ${p.name} (${p.pos}, ${p.team})` : `${slot.label}: EMPTY`;
    }).join("\n");

    const systemPrompt = `You are a fantasy football lineup analyzer. Today's date is September 2026.

YOUR ONLY JOB: Return a JSON object. Nothing else. No text before or after the JSON. No explanations. No markdown. Just the JSON object.

Search for each player's current week matchup, opponent, and injury status. Then build the optimal lineup.

FULL ROSTER:
${rosterStr}

CURRENT LINEUP SET BY USER:
${lineupStr}

Return this exact JSON structure:
{"starters":[{"name":"Player Name","pos":"QB","team":"TM","slot":"QB","opp":"vs OPP","oppRank":15,"verdict":"START","confidence":85,"note":"Short matchup note"}],"bench":[{"name":"Player Name","pos":"RB","team":"TM","opp":"@ OPP","oppRank":5,"verdict":"SIT","confidence":30,"note":"Why they sit"}],"keyDecisions":[{"title":"Decision headline","detail":"Brief explanation","urgency":"high"}]}

Rules:
- Fill slots: QB, RB1, RB2, WR1, WR2, TE, FLEX (best remaining RB/WR/TE), K, DEF
- Include "slot" field matching the slot key (QB, RB1, RB2, WR1, WR2, TE, FLEX, K, DEF)
- Everyone else in bench array
- oppRank: 1=toughest, 32=easiest
- verdict: MUST START, START, FLEX, SIT, or BENCH
- confidence: 0-100
- keyDecisions: 1-3 important calls, urgency: critical/high/medium
- Notes under 15 words each
- If your recommended lineup differs from the user's current lineup, note the changes in keyDecisions

RESPOND WITH ONLY THE JSON OBJECT.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [{ role: "user", content: "Generate my optimal lineup for this week with matchup analysis." }],
          max_tokens: 4000,
        }),
      });
      const data = await response.json();
      const raw = data.content?.map(b => b.text || "").join("") || "";
      let cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
      try {
        const parsed = JSON.parse(cleaned);
        setAnalysis(parsed);
        setHasRecommendation(true);
        const timestamp = new Date().toLocaleString();
        setLastRefreshed(timestamp);
        localStorage.setItem("depthchart-coach-analysis", JSON.stringify(parsed));
        localStorage.setItem("depthchart-coach-timestamp", timestamp);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr, "\nRaw:", raw);
        setAnalysis({ error: "The coach couldn't format the analysis. Try refreshing again." });
      }
    } catch (err) {
      console.error("Analysis error:", err);
    }
    setAnalysisLoading(false);
  }, [myTeam, lineup]);

  // Apply recommended lineup
  const applyRecommendation = useCallback(() => {
    if (!analysis?.starters) return;
    const newLineup = {};
    const usedIds = new Set();

    // Map recommended starters to slots
    for (const rec of analysis.starters) {
      const slot = rec.slot || rec.pos;
      const player = myTeam.find(p => p.name === rec.name);
      if (player && !usedIds.has(player.id)) {
        newLineup[slot] = player;
        usedIds.add(player.id);
      }
    }

    // Fill any missing slots from current lineup
    for (const slot of STARTER_SLOTS) {
      if (!newLineup[slot.key] && lineup[slot.key]) {
        const current = lineup[slot.key];
        if (!usedIds.has(current.id)) {
          newLineup[slot.key] = current;
          usedIds.add(current.id);
        }
      }
    }

    const newBench = myTeam.filter(p => !usedIds.has(p.id));
    saveLineup(newLineup, newBench);
    setHasRecommendation(false);
  }, [analysis, myTeam, lineup, saveLineup]);

  // Chat
  const sendChat = useCallback(async (userMsg) => {
    if (!userMsg.trim()) return;
    const newMsgs = [...chatMessages, { role: "user", text: userMsg }];
    setChatMessages(newMsgs);
    setChatInput("");
    setChatLoading(true);

    const rosterStr = myTeam.map(p => `${p.name} (${p.pos}, ${p.team}, Bye: ${p.bye})`).join("\n");
    const lineupStr = STARTER_SLOTS.map(slot => {
      const p = lineup[slot.key];
      return p ? `${slot.label}: ${p.name}` : `${slot.label}: EMPTY`;
    }).join(", ");
    const analysisStr = analysis?.starters
      ? `Current analysis: ${analysis.starters.map(p => `${p.name} (${p.verdict}, ${p.opp})`).join(", ")}`
      : "";

    const systemPrompt = `You are Depth Chart Coach — a fantasy football lineup advisor. Today's date is September 2026. The 2026 NFL season is underway.

CRITICAL DATA RULES:
- It is the 2026 NFL season. 2025 draft class = second year. 2026 draft class = rookies.
- If unsure about anything — use web search. Do NOT guess.

PERSONALITY: Direct, opinionated, concise. Answer first, reason second. Fantasy football only.

LEAGUE: 12-team, Full PPR, ESPN

ROSTER: ${rosterStr}
CURRENT LINEUP: ${lineupStr}
${analysisStr}

Keep responses under 150 words. No bullet points.`;

    const apiMessages = newMsgs.map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, messages: apiMessages }),
      });
      const data = await response.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Couldn't get a response.";
      setChatMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Connection error — try again." }]);
    }
    setChatLoading(false);
  }, [chatMessages, myTeam, lineup, analysis]);

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif",
      maxWidth: 692, margin: "0 auto", minHeight: "100vh",
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
            <div style={{ fontSize: 11, color: "#484f58", marginTop: 1 }}>Lineup Optimizer · {myTeam.length} players</div>
          </div>
          <button
            onClick={refreshAnalysis}
            disabled={analysisLoading || myTeam.length === 0}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12,
              background: analysisLoading || myTeam.length === 0 ? "#161b22" : "#3fb950",
              color: analysisLoading || myTeam.length === 0 ? "#484f58" : "#000",
              cursor: analysisLoading || myTeam.length === 0 ? "default" : "pointer",
            }}
          >{analysisLoading ? "Analyzing..." : "⟳ Refresh Matchups"}</button>
        </div>
        {lastRefreshed && (
          <div style={{ fontSize: 10, color: "#484f58", marginTop: 4 }}>Last updated: {lastRefreshed}</div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 2, padding: "6px 10px",
        background: "#0d1117", borderBottom: "1px solid #161b22",
      }}>
        {[
          { key: "lineup", label: "My Lineup" },
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

      {/* ── My Lineup ── */}
      {activeView === "lineup" && (
        <div style={{ padding: 14 }}>
          {myTeam.length === 0 ? (
            <div style={{ fontSize: 13, color: "#484f58", textAlign: "center", padding: 32 }}>
              No roster found. Draft players on the Draft Board or add them on the GM page.
            </div>
          ) : (
            <>
              {/* Update Lineup button when recommendation exists */}
              {hasRecommendation && analysis?.starters && (
                <div style={{
                  padding: "10px 12px", borderRadius: 8, marginBottom: 12,
                  background: "#3fb95015", border: "1px solid #3fb95040",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 12, color: "#3fb950", fontWeight: 600 }}>New lineup recommendation available</span>
                  <button onClick={applyRecommendation} style={{
                    padding: "6px 14px", borderRadius: 6, border: "none", fontWeight: 700, fontSize: 11,
                    background: "#3fb950", color: "#000", cursor: "pointer",
                  }}>Update Lineup</button>
                </div>
              )}

              {/* Key Decisions from analysis */}
              {analysis?.keyDecisions && analysis.keyDecisions.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  {analysis.keyDecisions.map((d, i) => {
                    const uc = URGENCY_COLORS[d.urgency] || URGENCY_COLORS.medium;
                    return (
                      <div key={i} style={{
                        background: "#0d1117", borderRadius: 8,
                        border: `1px solid ${uc.border}`, marginBottom: 6, overflow: "hidden",
                      }}>
                        <div style={{ padding: "3px 10px", background: uc.bg, fontSize: 9, fontWeight: 800, color: uc.text, letterSpacing: 0.5 }}>
                          {(d.urgency || "").toUpperCase()}
                        </div>
                        <div style={{ padding: "8px 10px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#e6edf3", marginBottom: 2 }}>{d.title}</div>
                          <div style={{ fontSize: 11, color: "#7d8590", lineHeight: 1.4 }}>{d.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Starters */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#3fb950", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Starting Lineup</div>
              {STARTER_SLOTS.map(slot => {
                const player = lineup[slot.key];
                // Find analysis data for this player
                const analysisData = analysis?.starters?.find(s => s.name === player?.name);
                const matchupColor = analysisData?.oppRank >= 20 ? "#3fb950" : analysisData?.oppRank >= 13 ? "#d29922" : analysisData?.oppRank <= 12 ? "#f85149" : "#484f58";
                const vs = analysisData ? (VERDICT_STYLE[analysisData.verdict] || { color: "#7d8590" }) : null;

                return (
                  <div key={slot.key} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                    background: "#0d1117", borderRadius: 6, marginBottom: 3,
                    borderLeft: `3px solid ${vs?.color || "#21262d"}`,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#484f58", width: 32, flexShrink: 0 }}>{slot.label}</span>
                    {player ? (
                      <>
                        <PosBadge pos={player.pos} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>{player.name}</div>
                          {analysisData?.note && <div style={{ fontSize: 10, color: "#484f58", marginTop: 1 }}>{analysisData.note}</div>}
                        </div>
                        <span style={{ fontSize: 10, color: "#484f58" }}>{player.team}</span>
                        {analysisData && (
                          <div style={{ textAlign: "right", minWidth: 55 }}>
                            <div style={{ fontSize: 10, color: "#484f58" }}>{analysisData.opp}</div>
                            {analysisData.oppRank > 0 && <div style={{ fontSize: 9, color: matchupColor, fontWeight: 700 }}>vs #{analysisData.oppRank}</div>}
                          </div>
                        )}
                        {vs && (
                          <div style={{ minWidth: 45, textAlign: "right" }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: vs.color }}>{analysisData.verdict}</div>
                            {analysisData.confidence > 0 && (
                              <div style={{ width: 35, height: 3, borderRadius: 2, background: "#21262d", marginTop: 2 }}>
                                <div style={{ width: `${analysisData.confidence}%`, height: "100%", borderRadius: 2, background: vs.color }} />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: "#484f58", fontStyle: "italic" }}>Empty</span>
                    )}
                  </div>
                );
              })}

              {/* Bench */}
              {bench.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f85149", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Bench</div>
                  {bench.map(p => {
                    const analysisData = analysis?.bench?.find(b => b.name === p.name);
                    return (
                      <div key={p.id} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                        background: "#0d1117", borderRadius: 6, marginBottom: 3, opacity: 0.6,
                        borderLeft: "3px solid #21262d",
                      }}>
                        <PosBadge pos={p.pos} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>{p.name}</div>
                          {analysisData?.note && <div style={{ fontSize: 10, color: "#484f58", marginTop: 1 }}>{analysisData.note}</div>}
                        </div>
                        <span style={{ fontSize: 10, color: "#484f58" }}>{p.team}</span>
                        {analysisData && (
                          <div style={{ textAlign: "right", minWidth: 55 }}>
                            <div style={{ fontSize: 10, color: "#484f58" }}>{analysisData.opp}</div>
                          </div>
                        )}
                        {analysisData && (
                          <div style={{ fontSize: 9, fontWeight: 800, color: "#f85149", minWidth: 45, textAlign: "right" }}>{analysisData.verdict}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Ask Coach Chat ── */}
      {activeView === "chat" && (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 10 }}>
            {chatMessages.length === 0 && (
              <div style={{ padding: "20px 0" }}>
                <div style={{ fontSize: 13, color: "#484f58", marginBottom: 16, lineHeight: 1.5 }}>
                  Ask me about your lineup, matchups, or start/sit decisions.
                </div>
                {[
                  "Who should I start at flex this week?",
                  "Any injury concerns I should know about?",
                  "Is this a ceiling week or a floor week?",
                  "Who's the weakest starter in my lineup?",
                  "Should I stream a defense this week?",
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
