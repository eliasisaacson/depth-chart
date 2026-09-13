"use client";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { NBA_PLAYERS } from "../../players-nba";

// Position colors — basketball
const POS_COLORS = {
  PG: { bg: "#e3f2fd", text: "#1565c0", border: "#90caf9" },
  SG: { bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7" },
  SF: { bg: "#fff3e0", text: "#e65100", border: "#ffcc80" },
  PF: { bg: "#fce4ec", text: "#c62828", border: "#ef9a9a" },
  C:  { bg: "#f3e5f5", text: "#6a1b9a", border: "#ce93d8" },
};

const TABS = ["Overall", "PG", "SG", "SF", "PF", "C"];

// Default roster slots for ESPN points league
const ROSTER_SLOTS = ["PG","SG","SF","PF","C","G","F","UTIL","UTIL","UTIL","BE","BE","BE"];

// ── Injury Status (2026-27 preseason) ──────────────────────────────────
const INJURIES = {
  "Tyrese Haliburton": { status: "Q", note: "Achilles tear rehab — expected for opening night but workload managed" },
  "Jayson Tatum": { status: "Q", note: "Returning from Achilles tear — cleared for full practice" },
  "Anthony Davis": { status: "Q", note: "Availability concerns — played only 20 games last season" },
  "Kawhi Leonard": { status: "M", note: "Load management expected — has played 56 or fewer games in 6 of 7 seasons" },
  "Zion Williamson": { status: "M", note: "Played 62 games last year but minutes capped under 30" },
  "Joel Embiid": { status: "M", note: "Health and minutes likely managed with deep Philadelphia roster" },
  "Fred VanVleet": { status: "Q", note: "Torn ACL last season — returning for 2026-27" },
  "Kyrie Irving": { status: "Q", note: "ACL tear rehab — did not play last season, targeting full return" },
  "Damian Lillard": { status: "Q", note: "Sat out all of last season with torn Achilles" },
  "Zach Edey": { status: "Q", note: "Foot injury — missed most of last season" },
  "Mark Williams": { status: "O", note: "Shoulder surgery — extended absence, no return timetable" },
  "Domantas Sabonis": { status: "Q", note: "Coming off lost season due to injury — health uncertain" },
};

function getInjuryBadge(name) {
  const inj = INJURIES[name];
  if (!inj) return null;
  const colors = {
    O: { bg: "#f85149", text: "#fff" },
    Q: { bg: "#d29922", text: "#000" },
    M: { bg: "#388bfd", text: "#fff" },
    S: { bg: "#f85149", text: "#fff" },
  };
  const labels = { O: "OUT", Q: "Q", M: "MON", S: "EXM" };
  const c = colors[inj.status];
  return { label: labels[inj.status], color: c, note: inj.note };
}

function getStealLevel(player, currentAvailableRank) {
  const expectedRank = player.adp;
  const drop = currentAvailableRank - expectedRank;
  if (drop >= 25) return { level: 3, label: "!!!", color: "#f0883e" };
  if (drop >= 15) return { level: 2, label: "!!", color: "#d29922" };
  if (drop >= 7) return { level: 1, label: "!", color: "#3fb950" };
  return null;
}

function getPicksUntilNext(struckCount, numTeams, draftPos, draftType) {
  if (draftType === "Auction") return null;
  const currentOverallPick = struckCount + 1;
  const myPicks = [];
  for (let r = 1; r <= 16; r++) {
    let pick;
    if (draftType === "Linear") { pick = (r - 1) * numTeams + draftPos; }
    else { const isOdd = r % 2 === 1; pick = isOdd ? (r - 1) * numTeams + draftPos : r * numTeams - draftPos + 1; }
    myPicks.push(pick);
  }
  const nextPick = myPicks.find(p => p >= currentOverallPick);
  if (!nextPick) return null;
  return { picksAway: nextPick - currentOverallPick, nextPick, isMyPick: nextPick - currentOverallPick === 0 };
}

function getDropoff(available, pos) {
  const posPlayers = available.filter(p => p.pos === pos);
  if (posPlayers.length < 2) return null;
  const gap = posPlayers[1].adp - posPlayers[0].adp;
  if (gap >= 8) return { top: posPlayers[0].name, gap: gap.toFixed(0), severity: "high" };
  if (gap >= 4) return { top: posPlayers[0].name, gap: gap.toFixed(0), severity: "mid" };
  return null;
}

function getRecommendation(myTeam, available, round) {
  const hasPos = (pos) => myTeam.filter(p => p.pos === pos).length;
  const pgs = hasPos("PG"), sgs = hasPos("SG"), sfs = hasPos("SF"), pfs = hasPos("PF"), cs = hasPos("C");
  const topAvail = (pos, n=5) => available.filter(p => p.pos === pos).slice(0, n);
  if (available.length === 0) return { pick: null, reason: "No players available." };
  if (round <= 3) { const best = available[0]; return { pick: best, reason: `Best available: ${best.name} (${best.pos}). In the early rounds, take the best player on the board regardless of position.` }; }
  if (round >= 4 && round <= 8) {
    if (cs === 0 && round >= 5) { const bestC = topAvail("C")[0]; if (bestC) return { pick: bestC, reason: `No center yet. ${bestC.name} is the best C available — elite centers are scarce after the top tier.` }; }
    if (pgs === 0) { const bestPG = topAvail("PG")[0]; if (bestPG) return { pick: bestPG, reason: `You need a point guard. ${bestPG.name} is the best PG on the board.` }; }
    const best = available[0]; return { pick: best, reason: `Best available value: ${best.name} (${best.pos}). Keep building the strongest roster.` };
  }
  if (round >= 9) {
    const needs = [];
    if (pgs < 2) needs.push("PG"); if (sgs < 2) needs.push("SG"); if (sfs < 2) needs.push("SF"); if (pfs < 2) needs.push("PF"); if (cs < 2) needs.push("C");
    if (needs.length > 0) { const pos = needs[0]; const best = topAvail(pos)[0]; if (best) return { pick: best, reason: `Filling ${pos} depth: ${best.name}.` }; }
  }
  const best = available[0]; return { pick: best, reason: `Best available: ${best.name} (${best.pos}).` };
}

// ── Components ───────────────────────────────────────────────────────────
function PosBadge({ pos }) {
  const c = POS_COLORS[pos] || { bg: "#eee", text: "#333", border: "#ccc" };
  return (<span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, border: `1px solid ${c.border}`, minWidth: 28, textAlign: "center", letterSpacing: 0.5 }}>{pos}</span>);
}

function PlayerRow({ player, rank, struck, onToggle, compact, stealLevel, onDraft, onUndraft, isDrafted }) {
  const inj = getInjuryBadge(player.name);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: compact ? "5px 10px" : "7px 12px", borderBottom: "1px solid var(--border)", background: struck ? "var(--struck-bg)" : stealLevel ? `${stealLevel.color}08` : "transparent", opacity: struck ? 0.45 : 1, transition: "all 0.15s ease" }}>
      <span onClick={() => onToggle(player.id)} style={{ width: 32, fontSize: 12, color: "var(--dim)", textAlign: "right", flexShrink: 0, cursor: "pointer", textDecoration: struck && !isDrafted ? "line-through" : "none" }} title="Click to cross off">{rank}</span>
      <PosBadge pos={player.pos} />
      <span onClick={() => onToggle(player.id)} style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--fg)", cursor: "pointer", textDecoration: struck ? "line-through" : "none" }}>
        {player.name}
        {inj && (<span title={inj.note} style={{ display: "inline-block", marginLeft: 4, padding: "0 4px", borderRadius: 3, fontSize: 9, fontWeight: 800, background: inj.color.bg, color: inj.color.text, verticalAlign: "middle", lineHeight: "14px", cursor: "help", textDecoration: "none" }}>{inj.label}</span>)}
        {stealLevel && !struck && (<span style={{ marginLeft: 4, fontSize: 11, fontWeight: 900, color: stealLevel.color, letterSpacing: -1 }}>{stealLevel.label}</span>)}
        {isDrafted && (<span style={{ marginLeft: 4, fontSize: 9, fontWeight: 800, background: "var(--green)", color: "#000", padding: "0 4px", borderRadius: 3, verticalAlign: "middle", lineHeight: "14px", textDecoration: "none", display: "inline-block" }}>MY PICK</span>)}
      </span>
      <span style={{ fontSize: 11, color: "var(--dim)", width: 36, textAlign: "center" }}>{player.team}</span>
      {!struck ? (<button onClick={(e) => { e.stopPropagation(); onDraft(player); }} disabled={!onDraft} style={{ padding: "3px 8px", borderRadius: 4, border: "none", fontSize: 10, fontWeight: 700, background: onDraft ? "var(--green)" : "var(--tab-bg)", color: onDraft ? "#000" : "var(--dim)", cursor: onDraft ? "pointer" : "default", whiteSpace: "nowrap", flexShrink: 0 }}>Draft</button>
      ) : isDrafted ? (<button onClick={(e) => { e.stopPropagation(); onUndraft(player.id); }} style={{ padding: "3px 8px", borderRadius: 4, border: "none", fontSize: 10, fontWeight: 700, background: "var(--red)", color: "#fff", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>Undo</button>
      ) : (<span style={{ width: 42, flexShrink: 0 }} />)}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────
export default function NBADraftBoard() {
  const [struckIds, setStruckIds] = useState(new Set());
  const [myTeam, setMyTeam] = useState([]);
  const [activeTab, setActiveTab] = useState("Overall");
  const [search, setSearch] = useState("");
  const [hideStruck, setHideStruck] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [numTeams, setNumTeams] = useState(12);
  const [draftPos, setDraftPos] = useState(3);
  const [draftType, setDraftType] = useState("Snake");
  const [scoringRules, setScoringRules] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [csvStatus, setCsvStatus] = useState("");
  const [customRankings, setCustomRankings] = useState(null);
  const [leagueFormat, setLeagueFormat] = useState("Points");
  const [showTutorial, setShowTutorial] = useState(false);
  const [draftStarted, setDraftStarted] = useState(false);
  const [currentOverallPick, setCurrentOverallPick] = useState(1);
  const [draftTimer, setDraftTimer] = useState(90);
  const [aiTeamRosters, setAiTeamRosters] = useState({});
  const [draftLog, setDraftLog] = useState([]);
  const [draftComplete, setDraftComplete] = useState(false);
  const [aiPicking, setAiPicking] = useState(false);
  const chatEndRef = { current: null };
  const totalPicks = numTeams * 13;

  useEffect(() => { try { const t = localStorage.getItem("depthchart-nba-myteam"); if (t) setMyTeam(JSON.parse(t)); const s = localStorage.getItem("depthchart-nba-struck"); if (s) setStruckIds(new Set(JSON.parse(s))); } catch {} }, []);
  useEffect(() => { if (!localStorage.getItem("depthchart-nba-tutorial-seen")) setShowTutorial(true); }, []);
  const round = Math.min(16, Math.floor(struckIds.size / numTeams) + 1);

  const handleCsvUpload = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => { try { const text = evt.target?.result; const lines = text.split("\n").map(l => l.trim()).filter(Boolean); const lookup = {}; NBA_PLAYERS.forEach(p => { lookup[p.name.toLowerCase()] = p; }); const ranked = []; let matched = 0; for (const line of lines) { const parts = line.split(",").map(s => s.trim().replace(/^["']|["']$/g, "")); let found = null; for (const part of parts) { const key = part.toLowerCase(); if (lookup[key]) { found = lookup[key]; break; } const match = NBA_PLAYERS.find(p => p.name.toLowerCase().includes(key) || key.includes(p.name.toLowerCase())); if (match && key.length > 4) { found = match; break; } } if (found && !ranked.some(r => r.id === found.id)) { ranked.push({ ...found, customRank: ranked.length + 1 }); matched++; } } if (matched > 0) { setCustomRankings(ranked); setCsvStatus(`✓ ${matched} players imported`); } else { setCsvStatus("Error: No matches found."); } } catch { setCsvStatus("Error: Could not parse CSV."); } };
    reader.readAsText(file); e.target.value = "";
  }, []);

  const toggle = useCallback((id) => { setStruckIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }, []);
  const addToTeam = useCallback((player) => { setMyTeam(prev => { if (prev.some(p => p.id === player.id)) return prev; return [...prev, player]; }); setStruckIds(prev => { const next = new Set(prev); next.add(player.id); return next; }); }, []);
  const removeFromTeam = useCallback((id) => { setMyTeam(prev => prev.filter(p => p.id !== id)); setStruckIds(prev => { const next = new Set(prev); next.delete(id); return next; }); }, []);

  // ── Mock Draft Logic ─────────────────────────────────────────────────
  const sorted = useMemo(() => { if (customRankings && customRankings.length > 0) { const rankedIds = new Set(customRankings.map(p => p.id)); const remaining = NBA_PLAYERS.filter(p => !rankedIds.has(p.id)).sort((a, b) => a.adp - b.adp); return [...customRankings, ...remaining]; } return [...NBA_PLAYERS].sort((a, b) => a.adp - b.adp); }, [customRankings]);
  const available = useMemo(() => sorted.filter(p => !struckIds.has(p.id)), [sorted, struckIds]);

  const getTeamForPick = (pick) => {
    const rd = Math.ceil(pick / numTeams);
    const isOdd = rd % 2 === 1;
    if (draftType === "Linear") return ((pick - 1) % numTeams) + 1;
    return isOdd ? ((pick - 1) % numTeams) + 1 : numTeams - ((pick - 1) % numTeams);
  };

  const myTeamNumber = draftPos;
  const currentTeamOnClock = getTeamForPick(currentOverallPick);
  const isMyTurn = draftStarted && currentTeamOnClock === myTeamNumber && !draftComplete;

  // Refs so effects always read latest state
  const sortedRef = useRef(sorted); sortedRef.current = sorted;
  const struckRef = useRef(struckIds); struckRef.current = struckIds;
  const aiRostersRef = useRef(aiTeamRosters); aiRostersRef.current = aiTeamRosters;
  const pickRef = useRef(currentOverallPick); pickRef.current = currentOverallPick;
  const [canSkip, setCanSkip] = useState(false);
  const aiTimeoutRef = useRef(null);

  const doAiPick = useCallback(() => {
    const pick = pickRef.current;
    const teamNum = getTeamForPick(pick);
    const teamRoster = aiRostersRef.current[teamNum] || [];
    const teamPosCount = (pos) => teamRoster.filter(p => p.pos === pos).length;
    const avail = sortedRef.current.filter(p => !struckRef.current.has(p.id));
    if (avail.length === 0) return;
    const needs = [];
    if (teamPosCount("PG") < 2) needs.push("PG");
    if (teamPosCount("SG") < 2) needs.push("SG");
    if (teamPosCount("SF") < 2) needs.push("SF");
    if (teamPosCount("PF") < 2) needs.push("PF");
    if (teamPosCount("C") < 1) needs.push("C");
    let candidates = avail.slice(0, 8);
    if (needs.length > 0 && teamRoster.length >= 3) {
      const needCandidates = candidates.filter(p => needs.includes(p.pos));
      if (needCandidates.length > 0) candidates = needCandidates;
    }
    const pickIndex = Math.floor(Math.random() * Math.min(3, candidates.length));
    const player = candidates[pickIndex];
    if (!player) return;

    // Strike off and record
    setStruckIds(prev => { const next = new Set(prev); next.add(player.id); return next; });
    if (teamNum === draftPos) {
      setMyTeam(prev => [...prev, player]);
    } else {
      setAiTeamRosters(prev => ({ ...prev, [teamNum]: [...(prev[teamNum] || []), player] }));
    }
    setDraftLog(prev => [...prev, { pick, team: teamNum, player }]);
    const nextPick = pick + 1;
    if (nextPick > totalPicks) { setDraftComplete(true); } else { setCurrentOverallPick(nextPick); }
    setDraftTimer(90);
    setAiPicking(false);
    setCanSkip(false);
  }, [draftPos, totalPicks]);

  // User drafts a player during mock
  const mockDraft = useCallback((player) => {
    if (!draftStarted || draftComplete) return;
    const pick = pickRef.current;
    const teamNum = getTeamForPick(pick);
    if (teamNum !== draftPos) return; // not my turn

    setStruckIds(prev => { const next = new Set(prev); next.add(player.id); return next; });
    setMyTeam(prev => { if (prev.some(p => p.id === player.id)) return prev; return [...prev, player]; });
    setDraftLog(prev => [...prev, { pick, team: draftPos, player }]);
    const nextPick = pick + 1;
    if (nextPick > totalPicks) { setDraftComplete(true); } else { setCurrentOverallPick(nextPick); }
    setDraftTimer(90);
  }, [draftStarted, draftComplete, draftPos, totalPicks]);

  // Single timer countdown
  useEffect(() => {
    if (!draftStarted || draftComplete) return;
    const interval = setInterval(() => {
      setDraftTimer(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [draftStarted, draftComplete]);

  // AI pick trigger — fires when it's not the user's turn
  useEffect(() => {
    if (!draftStarted || draftComplete || aiPicking) return;
    const teamNum = getTeamForPick(pickRef.current);
    if (teamNum === draftPos) return; // user's turn, don't auto-pick

    setAiPicking(true);
    setCanSkip(true);
    setDraftTimer(90);

    const rd = Math.ceil(pickRef.current / numTeams);
    const minSec = rd <= 3 ? 45 : rd <= 6 ? 50 : rd <= 9 ? 60 : 65;
    const maxSec = rd <= 3 ? 60 : rd <= 6 ? 70 : rd <= 9 ? 78 : 85;
    const thinkMs = (minSec + Math.random() * (maxSec - minSec)) * 1000;

    aiTimeoutRef.current = setTimeout(() => {
      doAiPick();
    }, thinkMs);

    return () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current); };
  }, [draftStarted, draftComplete, currentOverallPick, aiPicking, draftPos, numTeams, doAiPick]);

  // Skip button — clears timeout, picks immediately
  const skipAiPick = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    doAiPick();
  }, [doAiPick]);

  // Reset timer when it becomes user's turn
  useEffect(() => {
    if (isMyTurn && draftStarted && !draftComplete) setDraftTimer(90);
  }, [isMyTurn, draftStarted, draftComplete]);

  // Auto-pick for user if timer hits 0
  useEffect(() => {
    if (!draftStarted || !isMyTurn || draftComplete || draftTimer > 0) return;
    const avail = sortedRef.current.filter(p => !struckRef.current.has(p.id));
    if (avail.length > 0) {
      const player = avail[0];
      setStruckIds(prev => { const next = new Set(prev); next.add(player.id); return next; });
      setMyTeam(prev => [...prev, player]);
      setDraftLog(prev => [...prev, { pick: pickRef.current, team: draftPos, player }]);
      const nextPick = pickRef.current + 1;
      if (nextPick > totalPicks) { setDraftComplete(true); } else { setCurrentOverallPick(nextPick); }
      setDraftTimer(90);
    }
  }, [draftTimer, draftStarted, isMyTurn, draftComplete, draftPos, totalPicks]);

  useEffect(() => { if (myTeam.length > 0) localStorage.setItem("depthchart-nba-myteam", JSON.stringify(myTeam)); }, [myTeam]);
  useEffect(() => { if (struckIds.size > 0) localStorage.setItem("depthchart-nba-struck", JSON.stringify([...struckIds])); }, [struckIds]);

  const snakePick = useMemo(() => { const slot = draftPos; const picks = []; for (let r = 1; r <= 16; r++) { const isOdd = r % 2 === 1; if (draftType === "Linear") { picks.push({ round: r, pick: (r - 1) * numTeams + slot }); } else { picks.push({ round: r, pick: isOdd ? (r - 1) * numTeams + slot : r * numTeams - slot + 1 }); } } return picks; }, [draftPos, numTeams, draftType]);
  const filteredPlayers = useMemo(() => { let list = sorted; if (activeTab !== "Overall") { list = sorted.filter(p => p.pos === activeTab); } if (search) { const q = search.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)); } if (hideStruck) list = list.filter(p => !struckIds.has(p.id)); return list; }, [sorted, activeTab, search, struckIds, hideStruck]);
  const rec = useMemo(() => getRecommendation(myTeam, available, round), [myTeam, available, round]);
  const currentPick = snakePick.find(p => p.round === round);
  const MESSAGE_CAP = 20;
  const userMsgCount = chatMessages.filter(m => m.role === "user").length;
  const isAtCap = userMsgCount >= MESSAGE_CAP;

  const sendChat = useCallback(async (userMsg) => {
    if (!userMsg.trim()) return;
    const currentUserMsgs = chatMessages.filter(m => m.role === "user").length;
    if (currentUserMsgs >= MESSAGE_CAP) return;
    const newMsgs = [...chatMessages, { role: "user", text: userMsg }];
    setChatMessages(newMsgs); setChatInput(""); setChatLoading(true);
    const delayMs = currentUserMsgs < 5 ? 0 : Math.min((currentUserMsgs - 4) * 1000, 8000);
    if (delayMs > 0) await new Promise(resolve => setTimeout(resolve, delayMs));
    const rosterSummary = myTeam.length > 0 ? myTeam.map(p => `${p.name} (${p.pos}, ${p.team})`).join(", ") : "Empty";
    const topAvail = available.slice(0, 25).map((p, i) => `${i+1}. ${p.name} (${p.pos}, ${p.team}, Tier: ${p.tier}, ADP: ${p.adp})`).join("\n");
    const posCount = pos => myTeam.filter(p => p.pos === pos).length;
    const systemPrompt = `You are the Depth Chart Sports NBA draft advisor — an embedded AI assistant in a live fantasy basketball draft board. The current date is October 2026. The 2026-27 NBA season is about to begin.
CRITICAL DATA RULES:
- It is October 2026. The 2025-26 NBA season is OVER.
- Major offseason moves: Giannis to Miami, Luka to Lakers, LeBron to 76ers, LaMelo Ball to Timberwolves, Anthony Davis to Wizards, Cooper Flagg entering Year 2 with Dallas.
- If you are unsure about a player's current team, role, or any recent transaction — use web search. Do NOT guess.
ADVISOR PERSONALITY:
- Be direct, opinionated, and concise. Challenge weak logic but confirm good calls fast.
- You are a thought partner, not a yes-man. Push back when something doesn't make sense.
- Never break character. You are an NBA fantasy draft advisor, period.
LEAGUE SETTINGS:
- ${numTeams}-team ${draftType.toLowerCase()} draft, pick ${draftPos} overall
- League format: ${leagueFormat} league
- ${scoringRules ? `Scoring: ${scoringRules}` : leagueFormat === "9-Cat" ? "9-Category (FG%, FT%, 3PM, PTS, REB, AST, STL, BLK, TO)" : "Points league (standard scoring)"}
NBA DRAFT STRATEGY:
${leagueFormat === "9-Cat" ? `- Category league: consider punt strategies (punt FT%, punt AST, punt TO builds)
- Category scarcity: blocks and steals are premium categories
- Build archetypes: big man punt FT (Giannis, Wemby), guard punt blocks, balanced builds` : `- Points league: prioritize usage rate, minutes floor, and stat-stuffing ability
- Double-double and triple-double upside is king
- Positional scarcity: elite center production (Jokic, Wemby, KAT) is scarce
- Guards are deep — don't reach for a PG early unless top-5 talent`}
- Injury/load management risk is real — age 35+ players and injury-prone stars need discounting
- Rookie reliability: first-year players are volatile, discount their ADP slightly
CURRENT BOARD STATE:
- Round: ${round} | Total picks made: ${struckIds.size}
- My roster (${myTeam.length} players): ${rosterSummary}
- Position counts: PG:${posCount("PG")} SG:${posCount("SG")} SF:${posCount("SF")} PF:${posCount("PF")} C:${posCount("C")}
- Top 25 available players:
${topAvail}
Keep responses under 150 words. No bullet points.`;
    const apiMessages = []; for (const m of newMsgs) { apiMessages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text }); }
    try { const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system: systemPrompt, messages: apiMessages }) }); const data = await response.json(); const reply = data.content?.map(b => b.text || "").join("") || "Couldn't get a response."; setChatMessages(prev => [...prev, { role: "assistant", text: reply }]); } catch { setChatMessages(prev => [...prev, { role: "assistant", text: "Connection error — try again." }]); }
    setChatLoading(false);
  }, [chatMessages, myTeam, available, round, rec, snakePick, leagueFormat]);

  // ── Roster slot assignment logic ───────────────────────────────────────
  const rosterDisplay = useMemo(() => {
    const slots = ROSTER_SLOTS.map(s => ({ slot: s, player: null }));
    const assigned = new Set();
    // First pass: exact position matches
    for (const slot of slots) {
      if (slot.player) continue;
      const match = myTeam.find(p => !assigned.has(p.id) && p.pos === slot.slot);
      if (match) { slot.player = match; assigned.add(match.id); }
    }
    // Second pass: flex slots (G = PG/SG, F = SF/PF, UTIL = any)
    const flexMap = { G: ["PG","SG"], F: ["SF","PF"], UTIL: ["PG","SG","SF","PF","C"], BE: ["PG","SG","SF","PF","C"] };
    for (const slot of slots) {
      if (slot.player) continue;
      const eligible = flexMap[slot.slot];
      if (!eligible) continue;
      const match = myTeam.find(p => !assigned.has(p.id) && eligible.includes(p.pos));
      if (match) { slot.player = match; assigned.add(match.id); }
    }
    return slots;
  }, [myTeam]);

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: 1100, margin: "0 auto", height: "100vh",
      display: "flex", flexDirection: "column", overflow: "hidden",
      background: "var(--bg)", color: "var(--fg)",
      "--bg": "#0d1117", "--fg": "#e6edf3", "--dim": "#7d8590",
      "--border": "#21262d", "--card": "#161b22", "--accent": "#f97316",
      "--struck-bg": "#161b2280", "--green": "#3fb950", "--red": "#f85149",
      "--tab-bg": "#21262d", "--tab-active": "#f97316",
    }}>
      {/* ── Tutorial Overlay ── */}
      {showTutorial && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#161b22", borderRadius: 16, border: "1px solid #f9731640", maxWidth: 440, width: "100%", padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏀</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e6edf3", margin: "0 0 6px", letterSpacing: -0.5 }}>Welcome to your draft board</h2>
            <p style={{ fontSize: 13, color: "#7d8590", marginBottom: 24 }}>Three things to know before you start.</p>

            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f9731620", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, fontWeight: 800, color: "#f97316" }}>1</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3", marginBottom: 2 }}>Cross off picks</div>
                  <div style={{ fontSize: 12, color: "#7d8590", lineHeight: 1.4 }}>Tap a player's name to strike them off when another team drafts them. Tap again to undo.</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#3fb95020", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, fontWeight: 800, color: "#3fb950" }}>2</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3", marginBottom: 2 }}>Draft your players</div>
                  <div style={{ fontSize: 12, color: "#7d8590", lineHeight: 1.4 }}>Hit the green <span style={{ padding: "1px 6px", borderRadius: 3, background: "#3fb950", color: "#000", fontSize: 10, fontWeight: 700 }}>Draft</span> button to add a player to your roster. They'll appear in the roster bar up top.</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#58a6ff20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, fontWeight: 800, color: "#58a6ff" }}>3</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3", marginBottom: 2 }}>Ask the AI advisor</div>
                  <div style={{ fontSize: 12, color: "#7d8590", lineHeight: 1.4 }}>The advisor panel on the right recommends picks and flags value. Use the chat to debate picks, run scenarios, and challenge the AI.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setShowTutorial(false); localStorage.setItem("depthchart-nba-tutorial-seen", "1"); }}
              style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: "#f97316", color: "#000", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            >Got it — let's draft</button>
            <div style={{ marginTop: 10, fontSize: 11, color: "#484f58" }}>This won't show again.</div>
          </div>
        </div>
      )}

      {/* ── Start Draft Overlay (with settings) ── */}
      {!draftStarted && !showTutorial && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#161b22", borderRadius: 16, border: "1px solid #f9731640", maxWidth: 440, width: "100%", padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏀</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e6edf3", margin: "0 0 6px" }}>Set up your draft</h2>
            <p style={{ fontSize: 13, color: "#7d8590", marginBottom: 20 }}>Configure your league settings, then start drafting.</p>

            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
              {/* Teams */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>Number of teams</label>
                <select value={numTeams} onChange={e => setNumTeams(Number(e.target.value))} style={{ padding: "6px 12px", background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d", borderRadius: 6, fontSize: 13, width: 80 }}>
                  {[8,10,12,14,16].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {/* Draft position */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>Your draft position</label>
                <select value={draftPos} onChange={e => setDraftPos(Number(e.target.value))} style={{ padding: "6px 12px", background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d", borderRadius: 6, fontSize: 13, width: 80 }}>
                  {Array.from({length: numTeams}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {/* Draft type */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>Draft type</label>
                <select value={draftType} onChange={e => setDraftType(e.target.value)} style={{ padding: "6px 12px", background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d", borderRadius: 6, fontSize: 13, width: 120 }}>
                  {["Snake","Linear","Auction"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* League format */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>League format</label>
                <select value={leagueFormat} onChange={e => setLeagueFormat(e.target.value)} style={{ padding: "6px 12px", background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d", borderRadius: 6, fontSize: 13, width: 120 }}>
                  {["Points","9-Cat","8-Cat"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* Scoring rules */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3", display: "block", marginBottom: 4 }}>Custom scoring rules <span style={{ fontWeight: 400, color: "#484f58" }}>(optional)</span></label>
                <textarea value={scoringRules} onChange={e => setScoringRules(e.target.value)} placeholder="e.g. double-doubles +5, triple-doubles +10..." rows={2} style={{ width: "100%", background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d", borderRadius: 6, padding: "6px 10px", fontSize: 12, resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>

            <p style={{ fontSize: 11, color: "#484f58", marginBottom: 16 }}>AI opponents will draft between your turns. Each pick has a 90-second clock.</p>

            <button onClick={() => { setStruckIds(new Set()); setMyTeam([]); setAiTeamRosters({}); setDraftLog([]); setCurrentOverallPick(1); setDraftTimer(90); setDraftComplete(false); setChatMessages([]); localStorage.removeItem("depthchart-nba-myteam"); localStorage.removeItem("depthchart-nba-struck"); setDraftStarted(true); }} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: "#f97316", color: "#000", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>Start mock draft</button>
            <button onClick={() => { setStruckIds(new Set()); setMyTeam([]); setDraftLog([]); setCurrentOverallPick(1); setChatMessages([]); localStorage.removeItem("depthchart-nba-myteam"); localStorage.removeItem("depthchart-nba-struck"); setDraftStarted(true); setDraftTimer(999999); }} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "1px solid #30363d", background: "transparent", color: "#c9d1d9", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Manual mode (no timer, no AI)</button>
          </div>
        </div>
      )}

      {/* ── Draft Complete Overlay ── */}
      {draftComplete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#161b22", borderRadius: 16, border: "1px solid #3fb95040", maxWidth: 400, width: "100%", padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e6edf3", margin: "0 0 8px" }}>Draft complete!</h2>
            <p style={{ fontSize: 13, color: "#7d8590", marginBottom: 8 }}>Your {myTeam.length}-player roster is set.</p>
            <div style={{ textAlign: "left", margin: "16px 0", padding: 12, background: "#0d1117", borderRadius: 8, border: "1px solid #21262d" }}>
              {myTeam.map((p, i) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 12 }}>
                  <span style={{ width: 16, color: "#484f58", textAlign: "right" }}>{i+1}</span>
                  <PosBadge pos={p.pos} />
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: "#484f58" }}>{p.team}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "#f97316", fontWeight: 600, marginBottom: 16 }}>Ready for your real draft? Unlock live mode for $9.99.</p>
            <button onClick={() => { setDraftComplete(false); }} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "1px solid #30363d", background: "transparent", color: "#c9d1d9", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Review board</button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ padding: "12px 12px 8px", borderBottom: "2px solid var(--accent)" }}>
        {/* Row 1: Title + Clock + Round/Pick */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--accent)" }}>🏀 NBA Draft Board 2026-27</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Clock / Status */}
            {draftStarted && !draftComplete && (
              <div style={{
                padding: "6px 14px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8,
                background: isMyTurn ? "#3fb95015" : "#f9731610",
                border: `1px solid ${isMyTurn ? "#3fb95060" : "#f9731640"}`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: isMyTurn ? "#3fb950" : "#f97316" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: isMyTurn ? "#3fb950" : "#f97316" }}>
                  {isMyTurn ? "YOUR PICK" : `Team ${currentTeamOnClock} picking`}
                </span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{draftTimer}s</span>
                {canSkip && !isMyTurn && (
                  <button onClick={skipAiPick} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--dim)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Skip ⏩</button>
                )}
              </div>
            )}
            {draftComplete && (
              <div style={{ padding: "6px 14px", borderRadius: 8, background: "#3fb95015", border: "1px solid #3fb95060" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#3fb950" }}>🏁 DRAFT COMPLETE</span>
              </div>
            )}
            {/* Round + Pick boxes */}
            <div style={{ textAlign: "center", padding: "4px 10px", background: "var(--card)", borderRadius: 6, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, color: "var(--dim)" }}>Round</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{round}</div>
            </div>
            <div style={{ textAlign: "center", padding: "4px 10px", background: "var(--card)", borderRadius: 6, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, color: "var(--dim)" }}>Pick</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)" }}>#{currentPick?.pick || "—"}</div>
            </div>
          </div>
        </div>
        {/* Row 2: Settings (read-only labels) + CSV */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {[
            { label: "Teams", value: numTeams },
            { label: "Pick", value: draftPos },
            { label: "Type", value: draftType },
            { label: "Format", value: leagueFormat },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <span style={{ color: "var(--dim)", fontWeight: 500 }}>{s.label}</span>
              <span style={{ padding: "2px 8px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--fg)", fontWeight: 500 }}>{s.value}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "var(--tab-bg)", color: "var(--dim)", fontSize: 10, fontWeight: 600, cursor: "pointer", border: "1px solid var(--border)" }}>
              📄 Import Custom Player Rankings (CSV) <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleCsvUpload} />
            </label>
            {csvStatus && <span style={{ fontSize: 10, color: csvStatus.includes("Error") ? "var(--red)" : "var(--green)" }}>{csvStatus}</span>}
            {draftStarted && !draftComplete && (() => {
              const myPicks = [];
              for (let r = 1; r <= 13; r++) {
                const rd = r;
                const isOdd = rd % 2 === 1;
                const pick = draftType === "Linear" ? (rd - 1) * numTeams + draftPos : (isOdd ? (rd - 1) * numTeams + draftPos : rd * numTeams - draftPos + 1);
                myPicks.push(pick);
              }
              const nextPick = myPicks.find(p => p > currentOverallPick);
              if (!nextPick) return null;
              if (isMyTurn) return null;
              const picksAway = nextPick - currentOverallPick;
              return (
                <div style={{ padding: "4px 12px", borderRadius: 6, background: "#f9731610", border: "1px solid #f9731630", fontSize: 12, fontWeight: 600, color: "#f97316" }}>
                  {picksAway} pick{picksAway !== 1 ? "s" : ""} until yours (#{nextPick})
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Roster Bar (My Team — always visible) ── */}
      <div style={{ padding: "8px 12px", background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>My Team — {myTeam.length} drafted</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {rosterDisplay.map((s, i) => (
            s.player ? (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "#0d1117", borderRadius: 4, border: "1px solid var(--border)" }}>
                <PosBadge pos={s.player.pos} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{s.player.name.split(" ").pop()}</span>
                <span style={{ fontSize: 9, color: "var(--dim)" }}>{s.player.team}</span>
                <button onClick={() => removeFromTeam(s.player.id)} style={{ background: "none", border: "none", color: "var(--red)", fontSize: 10, cursor: "pointer", fontWeight: 700, padding: 0, marginLeft: 2 }}>✕</button>
              </div>
            ) : (
              <div key={i} style={{ padding: "3px 8px", borderRadius: 4, border: "1px dashed var(--border)", fontSize: 10, color: "var(--dim)" }}>{s.slot}</div>
            )
          ))}
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT: Draft Board ── */}
        <div style={{ flex: 1, minWidth: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, padding: "6px 8px", background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "5px 10px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", background: activeTab === tab ? "var(--tab-active)" : "transparent", color: activeTab === tab ? "#fff" : "var(--dim)", transition: "all 0.15s" }}>{tab}</button>
            ))}
          </div>
          {/* Search */}
          <div style={{ display: "flex", gap: 8, padding: "6px 10px", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players..." style={{ flex: 1, padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", color: "var(--fg)", fontSize: 12, outline: "none" }} />
            <label style={{ fontSize: 10, color: "var(--dim)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={hideStruck} onChange={e => setHideStruck(e.target.checked)} /> Hide struck
            </label>
          </div>
          {/* Player list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 12px", fontSize: 10, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 1 }}>
              <span style={{ width: 32, textAlign: "right" }}>#</span>
              <span style={{ width: 30 }}>Pos</span>
              <span style={{ flex: 1 }}>Player</span>
              <span style={{ width: 36, textAlign: "center" }}>Team</span>
            </div>
            {filteredPlayers.map((p, i) => {
              const sl = !struckIds.has(p.id) ? getStealLevel(p, struckIds.size + i + 1) : null;
              return (<PlayerRow key={p.id} player={p} rank={i + 1} struck={struckIds.has(p.id)} onToggle={toggle} compact={true} stealLevel={sl} onDraft={(!draftStarted || isMyTurn) ? (draftStarted ? mockDraft : addToTeam) : null} onUndraft={removeFromTeam} isDrafted={myTeam.some(tp => tp.id === p.id)} />);
            })}
            {filteredPlayers.length === 0 && (<p style={{ color: "var(--dim)", fontSize: 13, textAlign: "center", padding: 32 }}>No players match.</p>)}
          </div>
        </div>

        {/* ── RIGHT: Advisor (always visible) ── */}
        <div style={{ flex: 1.4, minWidth: 0, display: "flex", flexDirection: "column", overflowY: "auto", padding: 10 }}>
          {/* Recent picks log */}
          {draftStarted && draftLog.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", marginBottom: 3 }}>Recent picks</div>
              {draftLog.slice(-5).reverse().map((entry, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 6px", fontSize: 10, color: entry.team === myTeamNumber ? "var(--green)" : "var(--dim)" }}>
                  <span style={{ width: 20 }}>#{entry.pick}</span>
                  <span style={{ fontWeight: 600 }}>Tm {entry.team}{entry.team === myTeamNumber ? " (you)" : ""}</span>
                  <span>→</span>
                  <PosBadge pos={entry.player.pos} />
                  <span style={{ fontWeight: 500, color: entry.team === myTeamNumber ? "var(--green)" : "var(--fg)" }}>{entry.player.name}</span>
                </div>
              ))}
            </div>
          )}
          {/* Recommendation */}
          <div style={{ background: "var(--card)", borderRadius: 8, border: "1px solid var(--accent)40", padding: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Round {round} — Pick #{currentPick?.pick}</div>
            {rec.pick ? (<>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <PosBadge pos={rec.pick.pos} />
                <span style={{ fontSize: 15, fontWeight: 700 }}>{rec.pick.name}</span>
                <span style={{ fontSize: 11, color: "var(--dim)" }}>{rec.pick.team}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.4, margin: "8px 0 8px" }}>{rec.reason}</p>
              {(() => { const inj = INJURIES[rec.pick.name]; return inj ? (<div style={{ padding: "5px 8px", borderRadius: 5, marginBottom: 6, fontSize: 11, lineHeight: 1.3, background: inj.status === "O" ? "#f8514920" : "#d2992220", border: `1px solid ${inj.status === "O" ? "#f85149" : "#d29922"}`, color: inj.status === "O" ? "#f85149" : "#d29922" }}><span style={{ fontWeight: 700 }}>{inj.status === "O" ? "OUT" : "INJURY"}</span> {inj.note}</div>) : null; })()}
              <button onClick={() => draftStarted ? mockDraft(rec.pick) : addToTeam(rec.pick)} disabled={draftStarted && !isMyTurn} style={{ background: (draftStarted && !isMyTurn) ? "var(--tab-bg)" : "var(--green)", color: (draftStarted && !isMyTurn) ? "var(--dim)" : "#000", border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: (draftStarted && !isMyTurn) ? "default" : "pointer", width: "100%" }}>{draftStarted && !isMyTurn ? "Waiting for your turn..." : `Draft ${rec.pick.name}`}</button>
            </>) : <p style={{ color: "var(--dim)", fontSize: 12 }}>No players available.</p>}
          </div>

          {/* Drop-offs */}
          {(() => { const drops = ["C","PG","SG","SF","PF"].map(pos => ({ pos, ...getDropoff(available, pos) })).filter(d => d.top); if (drops.length === 0) return null; return (<div style={{ marginBottom: 8 }}><div style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", marginBottom: 3 }}>Drop-offs</div>{drops.map(d => (<div key={d.pos} style={{ padding: "3px 6px", borderRadius: 4, marginBottom: 2, fontSize: 10, background: d.severity === "high" ? "#f8514915" : "#d2992215", border: `1px solid ${d.severity === "high" ? "#f8514940" : "#d2992240"}`, color: d.severity === "high" ? "#f85149" : "#d29922" }}><span style={{ fontWeight: 700 }}>{d.pos}:</span> {d.top} — {d.gap}+ spot cliff</div>))}</div>); })()}

          {/* Also consider */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", marginBottom: 3 }}>Also consider</div>
            {available.slice(0, 4).map((p, i) => {
              const pinj = getInjuryBadge(p.name); const psteal = getStealLevel(p, struckIds.size + i + 1);
              return (<div key={p.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 6px", background: psteal ? `${psteal.color}08` : "var(--card)", borderRadius: 4, marginBottom: 2, cursor: (!draftStarted || isMyTurn) ? "pointer" : "default", border: `1px solid ${psteal ? psteal.color + "30" : "var(--border)"}`, fontSize: 11, opacity: (draftStarted && !isMyTurn) ? 0.5 : 1 }} onClick={() => { if (!draftStarted) addToTeam(p); else if (isMyTurn) mockDraft(p); }}>
                <PosBadge pos={p.pos} />
                <span style={{ flex: 1, fontWeight: 500 }}>{p.name}{pinj && <span title={pinj.note} style={{ display: "inline-block", marginLeft: 3, padding: "0 3px", borderRadius: 3, fontSize: 8, fontWeight: 800, background: pinj.color.bg, color: pinj.color.text, verticalAlign: "middle", lineHeight: "12px" }}>{pinj.label}</span>}{psteal && <span style={{ marginLeft: 3, fontSize: 10, fontWeight: 900, color: psteal.color }}>{psteal.label}</span>}</span>
                <span style={{ fontSize: 9, color: "var(--green)" }}>Draft</span>
              </div>);
            })}
          </div>

          {/* Chat */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>Talk it out</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: userMsgCount >= MESSAGE_CAP ? "var(--red)" : "var(--dim)" }}>{userMsgCount}/{MESSAGE_CAP}</div>
            </div>
            <div style={{ flex: 1, maxHeight: 260, overflowY: "auto", marginBottom: 6 }}>
              {chatMessages.length === 0 && (<div style={{ fontSize: 11, color: "var(--dim)", padding: "4px 0", lineHeight: 1.4 }}>Ask me anything — "Should I punt assists?", "Is Wemby worth #2?", "Best C available?"</div>)}
              {chatMessages.map((m, i) => (<div key={i} style={{ marginBottom: 6, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}><div style={{ padding: "6px 10px", borderRadius: 8, maxWidth: "90%", fontSize: 12, lineHeight: 1.4, background: m.role === "user" ? "var(--accent)" : "var(--card)", color: m.role === "user" ? "#000" : "var(--fg)", border: m.role === "user" ? "none" : "1px solid var(--border)" }}>{m.text}</div></div>))}
              {chatLoading && (<div style={{ padding: "6px 10px", fontSize: 11, color: "var(--dim)", fontStyle: "italic" }}>Thinking...</div>)}
              <div ref={el => { chatEndRef.current = el; if (el) el.scrollIntoView({ behavior: "smooth" }); }} />
            </div>
            {isAtCap && (<div style={{ padding: "6px 8px", borderRadius: 6, marginBottom: 6, fontSize: 11, background: "#f8514915", border: "1px solid #f8514940", color: "#f85149", textAlign: "center" }}>Message limit reached.</div>)}
            <div style={{ display: "flex", gap: 4 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !chatLoading && !isAtCap) sendChat(chatInput); }} placeholder={isAtCap ? "Limit reached" : "Debate a pick..."} disabled={chatLoading || isAtCap} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", color: "var(--fg)", fontSize: 12, outline: "none", opacity: isAtCap ? 0.5 : 1 }} />
              <button onClick={() => sendChat(chatInput)} disabled={chatLoading || !chatInput.trim() || isAtCap} style={{ padding: "6px 12px", borderRadius: 6, border: "none", fontWeight: 700, fontSize: 12, background: chatLoading || !chatInput.trim() || isAtCap ? "var(--tab-bg)" : "var(--accent)", color: chatLoading || !chatInput.trim() || isAtCap ? "var(--dim)" : "#000", cursor: chatLoading || !chatInput.trim() || isAtCap ? "default" : "pointer" }}>Send</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

