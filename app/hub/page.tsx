"use client";
import { useState } from "react";

// ── Active Sports & Leagues ─────────────────────────────────────────────

const SPORTS = [
  {
    key: "nfl",
    name: "NFL",
    icon: "🏈",
    season: "2026-27",
    color: "#3fb950",
    status: "in-season",
    week: "Week 5",
    leagues: [
      {
        name: "The Thunderdome",
        platform: "ESPN",
        format: "12-team · Full PPR",
        record: "3-1",
        rank: "3rd",
        nextEvent: "Waivers process Tue 3am",
        nextEventUrgent: true,
        modes: {
          gm: { available: true, badge: "3 moves recommended", badgeColor: "#d29922" },
          coach: { available: true, badge: "Lineup set", badgeColor: "#3fb950" },
          draft: { available: false, label: "Draft complete" },
        },
      },
      {
        name: "Office League",
        platform: "Yahoo",
        format: "10-team · Half PPR",
        record: "2-2",
        rank: "6th",
        nextEvent: "Set lineup by Sun 1pm",
        nextEventUrgent: false,
        modes: {
          gm: { available: true, badge: "1 move recommended", badgeColor: "#388bfd" },
          coach: { available: true, badge: "2 decisions pending", badgeColor: "#d29922" },
          draft: { available: false, label: "Draft complete" },
        },
      },
    ],
  },
  {
    key: "nba",
    name: "NBA",
    icon: "🏀",
    season: "2026-27",
    color: "#f0883e",
    status: "draft-season",
    week: "Drafts open",
    leagues: [
      {
        name: "Buckets Only",
        platform: "ESPN",
        format: "12-team · 9-cat",
        record: "—",
        rank: "—",
        nextEvent: "Draft Oct 18 @ 8pm",
        nextEventUrgent: true,
        modes: {
          draft: { available: true, badge: "Board ready", badgeColor: "#3fb950" },
          gm: { available: false, label: "Season hasn't started" },
          coach: { available: false, label: "Season hasn't started" },
        },
      },
    ],
  },
  {
    key: "nhl",
    name: "NHL",
    icon: "🏒",
    season: "2026-27",
    color: "#58a6ff",
    status: "draft-season",
    week: "Drafts open",
    leagues: [
      {
        name: "Cold Steel",
        platform: "Yahoo",
        format: "10-team · H2H categories",
        record: "—",
        rank: "—",
        nextEvent: "Draft Oct 12 @ 7pm",
        nextEventUrgent: true,
        modes: {
          draft: { available: true, badge: "Board ready", badgeColor: "#3fb950" },
          gm: { available: false, label: "Season hasn't started" },
          coach: { available: false, label: "Season hasn't started" },
        },
      },
    ],
  },
  {
    key: "mlb",
    name: "MLB",
    icon: "⚾",
    season: "2027",
    color: "#f85149",
    status: "offseason",
    week: "Feb 2027",
    leagues: [],
  },
];

const NOTIFICATIONS = [
  { sport: "🏈", text: "Tuten ruled OUT — Bigsby is the top waiver add", time: "2h ago", urgent: true },
  { sport: "🏈", text: "Office League: Burden questionable — monitor Friday practice", time: "4h ago", urgent: false },
  { sport: "🏀", text: "NBA preseason rankings updated — Wembanyama holds #1", time: "6h ago", urgent: false },
  { sport: "🏒", text: "NHL consensus rankings loaded — 6 sources averaged", time: "1d ago", urgent: false },
];

const MODE_META = {
  draft: { label: "Draft", icon: "📋", desc: "Live draft board with AI advisor" },
  gm: { label: "GM", icon: "🔄", desc: "Waiver wire & roster moves" },
  coach: { label: "Coach", icon: "📊", desc: "Start/sit & lineup optimizer" },
};

// ── Components ──────────────────────────────────────────────────────────

function ModeButton({ mode, data, sportColor }) {
  const meta = MODE_META[mode];
  if (!data) return null;

  if (!data.available) {
    return (
      <div style={{
        padding: "8px 12px", borderRadius: 8, background: "#0d111750",
        fontSize: 11, color: "#30363d", display: "flex", alignItems: "center", gap: 6,
      }}>
        <span>{meta.icon}</span>
        <span>{meta.label}</span>
        <span style={{ marginLeft: "auto", fontSize: 10 }}>{data.label}</span>
      </div>
    );
  }

  return (
    <button style={{
      width: "100%", padding: "10px 12px", borderRadius: 8,
      background: "#161b22", border: "1px solid #21262d",
      display: "flex", alignItems: "center", gap: 8,
      cursor: "pointer", transition: "border-color 0.15s",
      textAlign: "left",
    }}>
      <span style={{ fontSize: 16 }}>{meta.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3" }}>{meta.label}</div>
        <div style={{ fontSize: 10, color: "#484f58" }}>{meta.desc}</div>
      </div>
      {data.badge && (
        <span style={{
          padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700,
          background: data.badgeColor + "20", color: data.badgeColor,
          border: `1px solid ${data.badgeColor}40`,
          whiteSpace: "nowrap",
        }}>{data.badge}</span>
      )}
    </button>
  );
}

// ── Main ────────────────────────────────────────────────────────────────

export default function WarRoomHub() {
  const [expandedSport, setExpandedSport] = useState("nfl");

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif",
      maxWidth: 520, margin: "0 auto", minHeight: "100vh",
      background: "#090b10", color: "#c9d1d9",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 16px 14px",
        background: "linear-gradient(180deg, #0d1117 0%, #090b10 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#e6edf3", letterSpacing: -0.5 }}>
              Depth Chart
            </div>
            <div style={{ fontSize: 11, color: "#484f58", marginTop: 2 }}>4 sports · 4 leagues · 1 brain</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "#161b22",
            border: "2px solid #3fb950", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#3fb950",
          }}>E</div>
        </div>
      </div>

      {/* Notification feed */}
      <div style={{
        padding: "0 16px 12px",
        borderBottom: "1px solid #161b22",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#484f58", marginBottom: 8 }}>Recent</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NOTIFICATIONS.slice(0, 3).map((n, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "6px 10px", borderRadius: 6,
              background: n.urgent ? "#f8514908" : "transparent",
              borderLeft: n.urgent ? "2px solid #f85149" : "2px solid transparent",
            }}>
              <span style={{ fontSize: 12, flexShrink: 0 }}>{n.sport}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: n.urgent ? "#e6edf3" : "#7d8590", lineHeight: 1.4 }}>{n.text}</div>
              </div>
              <span style={{ fontSize: 9, color: "#30363d", whiteSpace: "nowrap", marginTop: 1 }}>{n.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sports */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#484f58", marginBottom: 10 }}>Your sports</div>

        {SPORTS.map(sport => {
          const isExpanded = expandedSport === sport.key;
          const isActive = sport.status !== "offseason";

          return (
            <div key={sport.key} style={{
              marginBottom: 10, borderRadius: 12, overflow: "hidden",
              border: `1px solid ${isExpanded ? sport.color + "40" : "#161b22"}`,
              background: "#0d1117",
              transition: "border-color 0.2s",
            }}>
              {/* Sport header */}
              <div
                onClick={() => setExpandedSport(isExpanded ? null : sport.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 24 }}>{sport.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#e6edf3" }}>{sport.name}</span>
                    <span style={{
                      padding: "1px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                      background: sport.status === "in-season" ? sport.color + "20" : sport.status === "draft-season" ? "#d2992220" : "#161b22",
                      color: sport.status === "in-season" ? sport.color : sport.status === "draft-season" ? "#d29922" : "#30363d",
                      border: `1px solid ${sport.status === "in-season" ? sport.color + "40" : sport.status === "draft-season" ? "#d2992240" : "#21262d"}`,
                    }}>
                      {sport.status === "in-season" ? sport.week : sport.status === "draft-season" ? "Draft season" : "Coming " + sport.week}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#484f58", marginTop: 2 }}>
                    {sport.leagues.length > 0 ? `${sport.leagues.length} league${sport.leagues.length > 1 ? "s" : ""}` : "No leagues yet"}
                  </div>
                </div>
                <span style={{ fontSize: 14, color: "#30363d", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
              </div>

              {/* Expanded: leagues & modes */}
              {isExpanded && sport.leagues.length > 0 && (
                <div style={{ padding: "0 14px 14px" }}>
                  {sport.leagues.map((league, li) => (
                    <div key={li} style={{
                      background: "#161b22", borderRadius: 10, padding: 14,
                      marginBottom: li < sport.leagues.length - 1 ? 10 : 0,
                    }}>
                      {/* League info */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3" }}>{league.name}</div>
                          <div style={{ fontSize: 10, color: "#484f58", marginTop: 1 }}>{league.platform} · {league.format}</div>
                        </div>
                        {league.record !== "—" && (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#e6edf3" }}>{league.record}</div>
                            <div style={{ fontSize: 9, color: "#484f58" }}>{league.rank}</div>
                          </div>
                        )}
                      </div>

                      {/* Next event */}
                      <div style={{
                        padding: "6px 10px", borderRadius: 6, marginBottom: 10,
                        background: league.nextEventUrgent ? "#d2992210" : "#090b10",
                        border: `1px solid ${league.nextEventUrgent ? "#d2992230" : "#21262d"}`,
                        fontSize: 11,
                        color: league.nextEventUrgent ? "#d29922" : "#484f58",
                      }}>
                        {league.nextEventUrgent && <span style={{ fontWeight: 700 }}>⏰ </span>}
                        {league.nextEvent}
                      </div>

                      {/* Mode buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {["draft", "gm", "coach"].map(mode => (
                          <ModeButton key={mode} mode={mode} data={league.modes[mode]} sportColor={sport.color} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Expanded: no leagues */}
              {isExpanded && sport.leagues.length === 0 && (
                <div style={{ padding: "0 14px 14px" }}>
                  <div style={{
                    background: "#161b22", borderRadius: 10, padding: 20,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{sport.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3", marginBottom: 4 }}>
                      {sport.name} is coming
                    </div>
                    <div style={{ fontSize: 11, color: "#484f58", marginBottom: 14, lineHeight: 1.5 }}>
                      Rankings and draft boards open when the season approaches. Add a league to get notified.
                    </div>
                    <button style={{
                      padding: "8px 20px", borderRadius: 6, border: "1px solid #21262d",
                      background: "transparent", color: "#7d8590", fontSize: 12,
                      fontWeight: 600, cursor: "pointer",
                    }}>Add a league</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add sport / league CTA */}
      <div style={{ padding: "8px 16px 24px" }}>
        <button style={{
          width: "100%", padding: "12px 0", borderRadius: 10,
          background: "transparent", border: "1px dashed #21262d",
          color: "#30363d", fontSize: 12, fontWeight: 600, cursor: "pointer",
          transition: "border-color 0.15s, color 0.15s",
        }}>
          + Add a league
        </button>
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "sticky", bottom: 0, padding: "10px 0",
        background: "#0d1117", borderTop: "1px solid #161b22",
        display: "flex", justifyContent: "space-around",
      }}>
        {[
          { icon: "🏠", label: "Home", active: true },
          { icon: "📊", label: "Leagues", active: false },
          { icon: "🔔", label: "Alerts", active: false },
          { icon: "⚙️", label: "Settings", active: false },
        ].map((tab, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            cursor: "pointer", opacity: tab.active ? 1 : 0.4,
          }}>
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, color: tab.active ? "#e6edf3" : "#484f58", fontWeight: 600 }}>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
