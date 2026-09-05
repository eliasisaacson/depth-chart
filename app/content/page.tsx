"use client";
import { useState, useCallback } from "react";

// ── Weekly Data Feed (same data that powers the app) ────────────────────
const WEEK = 5;
const WEEK_DATA = {
  topAdds: [
    { name: "Tank Bigsby", pos: "RB", team: "JAX", owned: 52, trend: "+28%", reason: "Tuten hamstring injury makes Bigsby the lead back for 2-3 weeks" },
    { name: "Tyrone Tracy Jr.", pos: "RB", team: "NYG", owned: 35, trend: "+12%", reason: "14+ touches per game, standalone RB2 value emerging" },
    { name: "De'Zhaun Stribling", pos: "WR", team: "SF", owned: 18, trend: "+15%", reason: "Pearsall out for season — Stribling is the new WR1 in SF" },
    { name: "Matthew Golden", pos: "WR", team: "GB", owned: 41, trend: "+9%", reason: "3 TDs in 4 games, deep threat clicking with Love" },
    { name: "Pittsburgh DEF", pos: "DEF", team: "PIT", owned: 45, trend: "+8%", reason: "Faces CAR Week 5, ATL Week 6 — elite 2-week stream" },
    { name: "Braelon Allen", pos: "RB", team: "NYJ", owned: 30, trend: "+6%", reason: "Hall's snap share dropping — Allen getting pass-down work" },
    { name: "Rashod Bateman", pos: "WR", team: "BAL", owned: 12, trend: "+11%", reason: "Flowers quad injury — Bateman seeing 8+ targets" },
    { name: "Chigoziem Okonkwo", pos: "TE", team: "TEN", owned: 28, trend: "+7%", reason: "TE6 through 4 weeks — reliable streaming option" },
    { name: "Elijah Mitchell", pos: "RB", team: "LAC", owned: 22, trend: "+4%", reason: "Hampton handcuff with standalone flex upside" },
    { name: "Cedric Tillman", pos: "WR", team: "CLE", owned: 20, trend: "+3%", reason: "Steady 6-target floor — boring but bankable WR3" },
  ],
  injuries: [
    { name: "Bhayshul Tuten", team: "JAX", injury: "Hamstring — out 2-3 weeks", impact: "Bigsby becomes must-add RB" },
    { name: "Zay Flowers", team: "BAL", injury: "Quad contusion — day-to-day", impact: "Bateman steps into WR2 role if Flowers sits" },
    { name: "Luther Burden III", team: "CHI", injury: "Groin — questionable", impact: "Risky flex play — monitor Friday practice" },
    { name: "Brock Purdy", team: "SF", injury: "Turf toe — out 2-5 weeks", impact: "Downgrades all SF skill players, elevates streaming against SF" },
    { name: "George Kittle", team: "SF", injury: "Hamstring — IR, 4+ weeks", impact: "Jake Tonges becomes a TE streamer" },
  ],
  startSit: [
    { decision: "start", name: "Omarion Hampton", opp: "vs ARI", reason: "ARI run D ranks 28th — smash spot for 20+ touches" },
    { decision: "start", name: "Emeka Egbuka", opp: "vs CHI", reason: "Steady target share, neutral matchup, safe WR2 floor" },
    { decision: "sit", name: "Terry McLaurin", opp: "vs CLE", reason: "CLE secondary ranks 6th — Daniels may check down, capping McLaurin" },
    { decision: "sit", name: "Denver DEF", opp: "@ KC", reason: "Arrowhead, limited ceiling — stream Pittsburgh instead" },
    { decision: "start", name: "Trey McBride", opp: "@ LAC", reason: "LAC allows TE receptions at 6th highest rate — top 3 TE play" },
  ],
};

// ── Post Templates ──────────────────────────────────────────────────────
const POST_TYPES = [
  {
    key: "waiver",
    title: "Waiver Wire",
    subtitle: "Tuesday AM",
    day: "Tuesday",
    icon: "🔄",
    color: "#58a6ff",
    prompt: (data) => `Write a fantasy football waiver wire article for Week ${WEEK} of the 2026 NFL season. Format it as a Substack newsletter post.

Tone: Confident, direct, opinionated. Write like a sharp fantasy analyst who doesn't hedge. Use "you" voice. No fluff intros — get to the picks fast.

Structure:
1. One-paragraph cold open (2-3 sentences max) about the waiver wire theme this week
2. "Priority Adds" section with the top 5 pickups, each getting 2-3 sentences explaining why they matter NOW
3. "Deep Stash" section with 2-3 deeper adds for managers looking ahead
4. Close with a 2-sentence CTA: mention that these are generic recommendations, and for roster-specific advice personalized to their team, they can try Depth Chart (depthchartsports.app) — the AI-powered draft board and weekly advisor

Top adds this week:
${data.topAdds.map((p, i) => `${i+1}. ${p.name} (${p.pos}, ${p.team}) — ${p.owned}% owned, trending ${p.trend} — ${p.reason}`).join("\n")}

Key injuries driving the wire:
${data.injuries.map(inj => `- ${inj.name} (${inj.team}): ${inj.injury} → ${inj.impact}`).join("\n")}

Keep it under 600 words. No bullet points in the actual prose — write in paragraphs. Use bold for player names only. End every section with substance, not filler.`,
  },
  {
    key: "injuries",
    title: "Injury Report",
    subtitle: "Wednesday",
    day: "Wednesday",
    icon: "🏥",
    color: "#f85149",
    prompt: (data) => `Write a fantasy football injury report article for Week ${WEEK} of the 2026 NFL season. Format it as a Substack newsletter post.

Tone: Clinical but accessible. Cut through the noise — only injuries that actually affect fantasy lineups. No "thoughts and prayers" filler.

Structure:
1. Cold open: one sentence framing the injury landscape this week
2. "The Ones That Matter" section — each injury gets the player name, what happened, the timeline, and exactly what fantasy managers should DO about it (add someone, hold, pivot)
3. "Stash Watch" — 1-2 injured players who might return soon and are worth grabbing now
4. Close with CTA: Depth Chart (depthchartsports.app) has live injury badges on every player in your draft board, updated through game day

Injuries this week:
${data.injuries.map(inj => `- ${inj.name} (${inj.team}): ${inj.injury} → Fantasy impact: ${inj.impact}`).join("\n")}

Keep it under 500 words. Write with urgency — this is time-sensitive information that affects lineups in 3 days.`,
  },
  {
    key: "startsit",
    title: "Start/Sit",
    subtitle: "Thursday PM",
    day: "Thursday",
    icon: "📊",
    color: "#3fb950",
    prompt: (data) => `Write a fantasy football start/sit article for Week ${WEEK} of the 2026 NFL season. Format it as a Substack newsletter post.

Tone: Decisive. Take a side on every call. Readers hate hedge words — say START or SIT and own it.

Structure:
1. Cold open: one sentence setting up the week's matchup landscape
2. "Starts" section — players you're confidently starting, with the matchup reason in 2-3 sentences each
3. "Sits" section — players people might start but shouldn't this week, with why
4. "The Flex Debate" — one specific player comparison readers are probably agonizing over, give a clear answer
5. Close with CTA: these calls are based on consensus matchup data — for lineup advice built around YOUR specific roster and opponent, check out Depth Chart Coach at depthchartsports.app

Start/sit calls:
${data.startSit.map(ss => `${ss.decision.toUpperCase()}: ${ss.name} ${ss.opp} — ${ss.reason}`).join("\n")}

Keep it under 550 words. Every paragraph should end with actionable information, not a vague "monitor the situation."`,
  },
  {
    key: "recap",
    title: "What We Got Right",
    subtitle: "Sunday Night",
    day: "Sunday",
    icon: "🎯",
    color: "#d29922",
    prompt: (data) => `Write a fantasy football weekly recap article for Week ${WEEK} of the 2026 NFL season. Format it as a Substack newsletter post.

Tone: Honest. Celebrate the hits but own the misses. Readers trust analysts who are accountable.

Structure:
1. Cold open: overall vibe of the week in one sentence
2. "Nailed It" — 2-3 calls from earlier in the week that hit, with the result
3. "Missed It" — 1-2 calls that didn't land, with honest analysis of why
4. "The Trend" — one emerging pattern from this week that changes next week's approach
5. Close with CTA: Depth Chart (depthchartsports.app) learns from every week's results — the AI advisor adjusts its recommendations based on what's actually happening on the field, not just preseason projections

Since this is a template for a future recap, use placeholder results like [RESULT] where actual scores would go. The structure and voice should be fully realized even with placeholders.

Keep it under 500 words. This post builds trust — don't oversell.`,
  },
  {
    key: "stockwatch",
    title: "Stock Up / Stock Down",
    subtitle: "Monday",
    day: "Monday",
    icon: "📈",
    color: "#f0883e",
    prompt: (data) => `Write a fantasy football stock watch article heading into Week ${WEEK + 1} of the 2026 NFL season. Format it as a Substack newsletter post.

Tone: Punchy and evaluative. Think stock market analysis applied to player values.

Structure:
1. Cold open: one sentence about how the landscape shifted this week
2. "Stock Up" — 3-4 players whose value increased based on Week ${WEEK} performance, usage, or opportunity changes. Each gets 2-3 sentences.
3. "Stock Down" — 3-4 players whose value dropped. Be honest but not cruel.
4. "Buy Low / Sell High" — one trade target in each direction for managers in trade-active leagues
5. Close with CTA: Depth Chart GM (depthchartsports.app) tracks these trends in real-time — the steal alert system flags when a player's value has shifted before your leaguemates notice

Use the waiver data and injury data to inform the stock movements:
${data.topAdds.slice(0, 5).map(p => `Rising: ${p.name} — ${p.reason}`).join("\n")}
${data.injuries.map(inj => `Falling: ${inj.name} — ${inj.injury}`).join("\n")}

Keep it under 550 words. This post sets up Tuesday's waiver article — end with a tease.`,
  },
];

// ── Components ──────────────────────────────────────────────────────────

export default function ContentEngine() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [generated, setGenerated] = useState({});
  const [loading, setLoading] = useState(null);
  const [copied, setCopied] = useState(false);

  const generatePost = useCallback(async (postType) => {
    setLoading(postType.key);
    setSelectedPost(postType.key);

    try {
            const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "You are a fantasy football content writer for Depth Chart Sports. Write engaging, opinionated Substack newsletter posts.",
                    messages: [{ role: "user", content: postType.prompt(WEEK_DATA) }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "Generation failed — try again.";
      setGenerated(prev => ({ ...prev, [postType.key]: text }));
    }     catch (err) {
      console.error("CONTENT ERROR:", err);
      setGenerated(prev => ({ ...prev, [postType.key]: "Connection error — try again." }));
    }
    setLoading(null);
  }, []);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const activePost = POST_TYPES.find(p => p.key === selectedPost);

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif",
      maxWidth: 520, margin: "0 auto", minHeight: "100vh",
      background: "#090b10", color: "#c9d1d9",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "2px solid #f0883e" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#e6edf3" }}>Depth Chart</span>
          <span style={{ fontSize: 11, color: "#f0883e", fontWeight: 700 }}>CONTENT</span>
        </div>
        <div style={{ fontSize: 11, color: "#484f58", marginTop: 2 }}>Substack Post Generator · Week {WEEK}</div>
      </div>

      {/* Calendar view (when no post selected) */}
      {!selectedPost && (
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 13, color: "#7d8590", marginBottom: 16, lineHeight: 1.5 }}>
            Each post is generated from the same data that powers Depth Chart's advisor. Hit generate, review, publish.
          </div>

          {POST_TYPES.map((post, i) => {
            const isGenerated = !!generated[post.key];
            return (
              <div key={post.key} style={{
                background: "#0d1117", borderRadius: 10,
                border: `1px solid ${isGenerated ? post.color + "40" : "#161b22"}`,
                marginBottom: 10, overflow: "hidden",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                }}>
                  <span style={{ fontSize: 22 }}>{post.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3" }}>{post.title}</div>
                    <div style={{ fontSize: 10, color: "#484f58", marginTop: 1 }}>{post.day} · Week {WEEK}</div>
                  </div>
                  {isGenerated && (
                    <span style={{
                      padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                      background: post.color + "20", color: post.color,
                    }}>Ready</span>
                  )}
                </div>
                <div style={{ padding: "0 14px 12px", display: "flex", gap: 8 }}>
                  <button
                    onClick={() => generatePost(post)}
                    disabled={loading === post.key}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 6, border: "none",
                      background: loading === post.key ? "#161b22" : post.color,
                      color: loading === post.key ? "#484f58" : "#000",
                      fontSize: 12, fontWeight: 700, cursor: loading === post.key ? "default" : "pointer",
                    }}
                  >{loading === post.key ? "Generating..." : isGenerated ? "Regenerate" : "Generate"}</button>
                  {isGenerated && (
                    <button
                      onClick={() => setSelectedPost(post.key)}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 6,
                        background: "transparent", border: `1px solid ${post.color}40`,
                        color: post.color, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}
                    >Preview</button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Data source info */}
          <div style={{
            marginTop: 12, padding: 14, borderRadius: 8,
            background: "#0d1117", border: "1px solid #161b22",
            fontSize: 11, color: "#484f58", lineHeight: 1.5,
          }}>
            Data sources this week: Weighted multi-source consensus rankings, ESPN injury feed, matchup data from PFF, ownership trends from multi-platform ADP. All posts include Depth Chart CTAs driving to depthchartsports.app.
          </div>
        </div>
      )}

      {/* Preview view */}
      {selectedPost && activePost && (
        <div style={{ padding: 14 }}>
          {/* Back + actions bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <button
              onClick={() => setSelectedPost(null)}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "1px solid #21262d",
                background: "transparent", color: "#7d8590", fontSize: 12,
                cursor: "pointer",
              }}
            >← Back</button>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => copyToClipboard(generated[selectedPost] || "")}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none",
                background: copied ? "#3fb950" : activePost.color,
                color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >{copied ? "Copied!" : "Copy to clipboard"}</button>
          </div>

          {/* Post header */}
          <div style={{
            background: "#0d1117", borderRadius: 10, border: `1px solid ${activePost.color}30`,
            padding: 16, marginBottom: 12,
          }}>
            <div style={{ fontSize: 10, color: activePost.color, fontWeight: 700, marginBottom: 4 }}>
              {activePost.day.toUpperCase()} · WEEK {WEEK}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#e6edf3", lineHeight: 1.3 }}>
              {activePost.key === "waiver" && `Depth Chart Waiver Wire: ${WEEK_DATA.topAdds.length} Pickups That Win Week ${WEEK}`}
              {activePost.key === "injuries" && `The Injury Report That Actually Matters — Week ${WEEK}`}
              {activePost.key === "startsit" && `Start/Sit: The ${WEEK_DATA.startSit.length} Hardest Lineup Calls This Week`}
              {activePost.key === "recap" && `What We Got Right, What We Missed — Week ${WEEK}`}
              {activePost.key === "stockwatch" && `Stock Up / Stock Down Heading Into Week ${WEEK + 1}`}
            </div>
          </div>

          {/* Generated content */}
          {generated[selectedPost] ? (
            <div style={{
              background: "#0d1117", borderRadius: 10, border: "1px solid #161b22",
              padding: 16,
            }}>
              <div style={{
                fontSize: 13, lineHeight: 1.75, color: "#c9d1d9",
                whiteSpace: "pre-wrap",
              }}>
                {generated[selectedPost]}
              </div>
            </div>
          ) : (
            <div style={{
              background: "#0d1117", borderRadius: 10, border: "1px solid #161b22",
              padding: 32, textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{activePost.icon}</div>
              <div style={{ fontSize: 13, color: "#484f58", marginBottom: 14 }}>
                Not generated yet. Hit the button to create this post.
              </div>
              <button
                onClick={() => generatePost(activePost)}
                disabled={loading === activePost.key}
                style={{
                  padding: "10px 24px", borderRadius: 6, border: "none",
                  background: activePost.color, color: "#000",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >{loading === activePost.key ? "Generating..." : "Generate post"}</button>
            </div>
          )}

          {/* Publishing tips */}
          {generated[selectedPost] && (
            <div style={{
              marginTop: 12, padding: 12, borderRadius: 8,
              background: "#161b22", fontSize: 11, color: "#484f58", lineHeight: 1.5,
            }}>
              Before publishing: review for accuracy, add any last-minute injury updates, and make sure the Depth Chart CTA link (depthchartsports.app) is live. Substack lets you schedule posts — Tuesday AM at 6am ET catches the early waiver wire crowd.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
