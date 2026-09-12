"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { PLAYERS } from "../players";

// Player data imported from ../players

// Position colors
const POS_COLORS = {
  QB: { bg: "#fce4ec", text: "#c62828", border: "#ef9a9a" },
  RB: { bg: "#e3f2fd", text: "#1565c0", border: "#90caf9" },
  WR: { bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7" },
  TE: { bg: "#fff3e0", text: "#e65100", border: "#ffcc80" },
  K:  { bg: "#f3e5f5", text: "#6a1b9a", border: "#ce93d8" },
  DEF:{ bg: "#eceff1", text: "#37474f", border: "#b0bec5" },
  LB: { bg: "#fce4ec", text: "#880e4f", border: "#f48fb1" },
  DL: { bg: "#e8eaf6", text: "#283593", border: "#9fa8da" },
  DB: { bg: "#e0f7fa", text: "#00695c", border: "#80cbc4" },
};

const TABS = ["Overall", "QB", "RB", "WR", "TE", "K", "DEF", "My Team", "Advisor"];
const IDP_POSITIONS = [];

// ── Injury Status (as of Sep 4 2026) ────────────────────────────────────
const INJURIES = {
  "Ja'Marr Chase": { status: "Q", note: "Hyperextended knee Aug 25 — expected Week 1 but limited practice" },
  "Jeremiyah Love": { status: "Q", note: "High ankle sprain — Week 1 status uncertain" },
  "Ashton Jeanty": { status: "Q", note: "Ankle sprain — coach 'optimistic' for Week 1, Mike Washington Jr. insurance" },
  "Malik Nabers": { status: "Q", note: "ACL rehab + cyclops lesion surgery — Week 1 return unlikely at full speed" },
  "George Kittle": { status: "Q", note: "Achilles tear rehab — trending toward Week 1 in Australia" },
  "Zay Flowers": { status: "Q", note: "Quad contusion — day-to-day, no official designation" },
  "Tyler Warren": { status: "Q", note: "Groin — continued limitations in practice" },
  "Luther Burden III": { status: "Q", note: "Groin — ruled out of preseason, questionable Week 1" },
  "Patrick Mahomes": { status: "Q", note: "Torn ACL/LCL rehab — targeting Week 1 but workload may be managed" },
  "Mike Evans": { status: "Q", note: "Quad injuries + groin strain — expected to play Week 1" },
  "Puka Nacua": { status: "M", note: "Groin — team not concerned, monitor only" },
  "Rashee Rice": { status: "M", note: "Cleared to practice — but averages 11 missed games/yr past 2 seasons" },
  "Breece Hall": { status: "M", note: "Left practice with injury — monitor" },
  "TreVeyon Henderson": { status: "M", note: "Ankle — expected to play Week 1" },
  "Josh Jacobs": { status: "S", note: "Commissioner Exempt List — no return timeline" },
  "Zach Charbonnet": { status: "O", note: "Reserve PUP — out minimum 4 games" },
  "Makai Lemon": { status: "M", note: "Hamstring — returned to full practice" },
  "Brock Purdy": { status: "Q", note: "Turf toe — ruled out Week 2 already, may miss 2-5 weeks" },
};

// status: O=Out, Q=Questionable, M=Monitor, S=Suspended/Exempt

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

// ── Bye Week Stacking Check (weeks 1-10 only) ──────────────────────────
function checkByeConflict(myTeam, candidate) {
  if (candidate.bye > 10) return null;
  const sameBye = myTeam.filter(p =>
    p.bye === candidate.bye &&
    !["K", "DEF", "LB", "DL", "DB"].includes(p.pos)
  );
  if (sameBye.length >= 2) {
    return {
      bye: candidate.bye,
      count: sameBye.length + 1,
      players: [...sameBye.map(p => p.name), candidate.name],
    };
  }
  return null;
}

// ── Handcuff Map ────────────────────────────────────────────────────────
const HANDCUFFS = {
  "Bijan Robinson": "Brian Robinson Jr.",
  "Jahmyr Gibbs": "Craig Reynolds",
  "Jonathan Taylor": "Trey Sermon",
  "De'Von Achane": "Raheem Mostert",
  "Christian McCaffrey": "Jordan Mason",
  "James Cook III": "Ray Davis",
  "Saquon Barkley": "Kenny Gainwell",
  "Chase Brown": "Zack Moss",
  "Omarion Hampton": "Gus Edwards",
  "Derrick Henry": "Justice Hill",
  "Kenneth Walker": "Isiah Pacheco",
  "Ashton Jeanty": "Mike Washington Jr.",
  "Jeremiyah Love": "Tyler Allgeier",
  "Javonte Williams": "Rico Dowdle",
  "Kyren Williams": "Blake Corum",
  "Breece Hall": "Braelon Allen",
  "Travis Etienne Jr.": "Kendre Miller",
  "D'Andre Swift": "Kyle Monangai",
  "Cam Skattebo": "Tyrone Tracy Jr.",
  "Bucky Irving": "Kenny Gainwell",
  "Quinshon Judkins": "Jerome Ford",
  "Bhayshul Tuten": "Chris Rodriguez Jr.",
  "Jadarian Price": "Zach Charbonnet",
};

// ── Steal Indicator (!  !! !!!) ─────────────────────────────────────────
function getStealLevel(player, currentAvailableRank) {
  const expectedRank = player.adp;
  const drop = currentAvailableRank - expectedRank;
  if (drop >= 25) return { level: 3, label: "!!!", color: "#f0883e" };
  if (drop >= 15) return { level: 2, label: "!!", color: "#d29922" };
  if (drop >= 7) return { level: 1, label: "!", color: "#3fb950" };
  return null;
}

// ── Roster Construction Targets ─────────────────────────────────────────
const ROSTER_TARGETS = {
  3:  { QB: 0, RB: 1, WR: "0-1", TE: 0 },
  5:  { QB: 0, RB: 2, WR: "1-2", TE: "0-1" },
  8:  { QB: 1, RB: "2-3", WR: "2-3", TE: 1 },
  10: { QB: 1, RB: 3, WR: "3-4", TE: 1 },
  13: { QB: "1-2", RB: "4-5", WR: "4-5", TE: 1 },
};

// ── Picks Until Next Turn Calculator ────────────────────────────────────
function getPicksUntilNext(struckCount, numTeams, draftPos, draftType) {
  if (draftType === "Auction") return null; // No pick order in auction

  const totalPicks = numTeams * 18; // 18 rounds max
  const currentOverallPick = struckCount + 1; // Next pick to be made

  // Build list of all user's picks
  const myPicks = [];
  for (let r = 1; r <= 18; r++) {
    let pick;
    if (draftType === "Linear") {
      pick = (r - 1) * numTeams + draftPos;
    } else {
      // Snake: odd rounds go forward, even rounds go backward
      const isOdd = r % 2 === 1;
      pick = isOdd ? (r - 1) * numTeams + draftPos : r * numTeams - draftPos + 1;
    }
    myPicks.push(pick);
  }

  // Find the next user pick that hasn't happened yet
  const nextPick = myPicks.find(p => p >= currentOverallPick);
  if (!nextPick) return null; // All picks done

  const picksAway = nextPick - currentOverallPick;
  return { picksAway, nextPick, isMyPick: picksAway === 0 };
}

// ── VOR / Positional Drop-off ───────────────────────────────────────────
function getDropoff(available, pos) {
  const posPlayers = available.filter(p => p.pos === pos);
  if (posPlayers.length < 2) return null;
  const gap = posPlayers[1].adp - posPlayers[0].adp;
  if (gap >= 8) return { top: posPlayers[0].name, gap: gap.toFixed(0), severity: "high" };
  if (gap >= 4) return { top: posPlayers[0].name, gap: gap.toFixed(0), severity: "mid" };
  return null;
}

// ── Strategy Engine ──────────────────────────────────────────────────────
function getRecommendation(myTeam, available, round) {
  const hasPos = (pos) => myTeam.filter(p => p.pos === pos).length;
  const rbs = hasPos("RB"), wrs = hasPos("WR"), qbs = hasPos("QB"), tes = hasPos("TE");
  const topAvail = (pos, n=5) => available.filter(p => p.pos === pos).slice(0, n);

  // Round 1 (pick 3)
  if (round === 1) {
    const bijan = available.find(p => p.name === "Bijan Robinson");
    if (bijan) return { pick: bijan, reason: "Bijan is available at 3. Elite RB in full PPR — his pass-catching neutralizes loaded-box risk. Take him per your plan." };
    const jsn = available.find(p => p.name === "Jaxon Smith-Njigba");
    if (jsn) return { pick: jsn, reason: "Robinson gone. JSN is your fallback — elite PPR WR floor. Pivot to RB-RB at picks 22/27." };
    const best = available[0];
    return { pick: best, reason: `Both Robinson and JSN gone (unusual). Best available is ${best.name} — take the value.` };
  }

  // Rounds 2-3 (picks 22, 27)
  if (round === 2 || round === 3) {
    const hasJSN = myTeam.some(p => p.name === "Jaxon Smith-Njigba");
    const hasBijan = myTeam.some(p => p.name === "Bijan Robinson");

    if (hasBijan && round === 2) {
      const bestRB = topAvail("RB")[0];
      const mcbride = available.find(p => p.name === "Trey McBride");
      if (bestRB) return { pick: bestRB, reason: `You have Bijan. Lock in RB depth with ${bestRB.name}. McBride is also an option at your next pick.` };
    }
    if (hasBijan && round === 3) {
      const mcbride = available.find(p => p.name === "Trey McBride");
      const bestRB = topAvail("RB")[0];
      if (rbs < 2 && bestRB) return { pick: bestRB, reason: `Only ${rbs} RB so far. Grab ${bestRB.name} for RB2 depth before the position thins.` };
      if (mcbride) return { pick: mcbride, reason: "McBride is the TE1 with massive PPR upside. With Bijan + an RB2 locked, this is the spot." };
      if (bestRB) return { pick: bestRB, reason: `RB depth still thin. ${bestRB.name} is the best available.` };
    }
    if (hasJSN) {
      const bestRB = topAvail("RB")[0];
      if (bestRB) return { pick: bestRB, reason: `JSN plan: RB-RB at picks 22/27 without deviation. Take ${bestRB.name}.` };
    }
    // Fallback
    const bestRB = topAvail("RB")[0];
    if (bestRB && rbs < 2) return { pick: bestRB, reason: `You need RB depth. ${bestRB.name} is the best available.` };
    const best = available[0];
    return { pick: best, reason: `Best available value: ${best.name}.` };
  }

  // Rounds 4-6: WR priority
  if (round >= 4 && round <= 6) {
    if (wrs < 2) {
      const bestWR = topAvail("WR")[0];
      if (bestWR) return { pick: bestWR, reason: `WR round. ${bestWR.name} is the top WR available — build your receiver corps.` };
    }
    if (tes === 0) {
      const mcbride = available.find(p => p.name === "Trey McBride");
      const bowers = available.find(p => p.name === "Brock Bowers");
      const bestTE = topAvail("TE")[0];
      if (mcbride) return { pick: mcbride, reason: "McBride still on the board — grab the TE1 before it's too late." };
      if (bowers) return { pick: bowers, reason: "Bowers is a steal here. Lock in your TE." };
      if (bestTE && round >= 5) return { pick: bestTE, reason: `TE getting thin. ${bestTE.name} is the best option.` };
    }
    const bestWR = topAvail("WR")[0];
    const bestAvail = available[0];
    if (bestWR && bestWR.adp <= bestAvail.adp + 10) return { pick: bestWR, reason: `Continue building WR depth with ${bestWR.name}.` };
    return { pick: bestAvail, reason: `Best available value: ${bestAvail.name} (${bestAvail.pos}).` };
  }

  // Rounds 6-8: QB window
  if (round >= 6 && round <= 8 && qbs === 0) {
    const bestQB = topAvail("QB")[0];
    if (bestQB) return { pick: bestQB, reason: `QB window (rounds 6-8). ${bestQB.name} is your best option. Don't repeat the Josh Allen mistake — but do get your QB1 in this range.` };
  }

  // Rounds 9+: Fill gaps, K, DEF late
  if (round >= 9) {
    if (qbs === 0) {
      const bestQB = topAvail("QB")[0];
      if (bestQB) return { pick: bestQB, reason: `You still need a QB. ${bestQB.name} is the pick.` };
    }
    if (tes === 0) {
      const bestTE = topAvail("TE")[0];
      if (bestTE) return { pick: bestTE, reason: `No TE yet. Grab ${bestTE.name}.` };
    }
    if (rbs < 4) {
      const bestRB = topAvail("RB")[0];
      if (bestRB) return { pick: bestRB, reason: `RB depth pick: ${bestRB.name}.` };
    }
    if (wrs < 4) {
      const bestWR = topAvail("WR")[0];
      if (bestWR) return { pick: bestWR, reason: `WR depth: ${bestWR.name}.` };
    }
  }

  // Deep rounds: K, DEF
  if (round >= 12) {
    const needs = [];
    if (!myTeam.some(p => p.pos === "K")) needs.push("K");
    if (!myTeam.some(p => p.pos === "DEF")) needs.push("DEF");
    if (needs.length > 0) {
      const pos = needs[0];
      const searchPos = pos === "IDP" ? IDP_POSITIONS : [pos];
      const best = available.filter(p => searchPos.includes(p.pos))[0];
      if (best) return { pick: best, reason: `Fill your ${pos} slot: ${best.name}.` };
    }
  }

  const best = available[0];
  return { pick: best, reason: `Best available: ${best.name} (${best.pos}).` };
}

// ── Components ───────────────────────────────────────────────────────────
function PosBadge({ pos }) {
  const c = POS_COLORS[pos] || { bg: "#eee", text: "#333", border: "#ccc" };
  return (
    <span style={{
      display: "inline-block", padding: "1px 6px", borderRadius: 4, fontSize: 11,
      fontWeight: 700, background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      minWidth: 28, textAlign: "center", letterSpacing: 0.5
    }}>{pos}</span>
  );
}

function PlayerRow({ player, rank, struck, onToggle, compact, stealLevel, onDraft, onUndraft, isDrafted }) {
  const inj = getInjuryBadge(player.name);
  const hc = HANDCUFFS[player.name];
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: compact ? "5px 10px" : "7px 12px",
        borderBottom: "1px solid var(--border)",
        background: struck ? "var(--struck-bg)" : stealLevel ? `${stealLevel.color}08` : "transparent",
        opacity: struck ? 0.45 : 1,
        transition: "all 0.15s ease",
      }}
    >
      <span
        onClick={() => onToggle(player.id)}
        style={{ width: 32, fontSize: 12, color: "var(--dim)", textAlign: "right", flexShrink: 0, cursor: "pointer", textDecoration: struck && !isDrafted ? "line-through" : "none" }}
        title="Click to cross off"
      >
        {rank}
      </span>
      <PosBadge pos={player.pos} />
      <span
        onClick={() => onToggle(player.id)}
        style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--fg)", cursor: "pointer", textDecoration: struck ? "line-through" : "none" }}
      >
        {player.name}
        {inj && (
          <span title={inj.note} style={{
            display: "inline-block", marginLeft: 4, padding: "0 4px", borderRadius: 3,
            fontSize: 9, fontWeight: 800, background: inj.color.bg, color: inj.color.text,
            verticalAlign: "middle", lineHeight: "14px", cursor: "help", textDecoration: "none",
          }}>{inj.label}</span>
        )}
        {stealLevel && !struck && (
          <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 900, color: stealLevel.color, letterSpacing: -1 }}>{stealLevel.label}</span>
        )}
        {isDrafted && (
          <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 800, background: "var(--green)", color: "#000", padding: "0 4px", borderRadius: 3, verticalAlign: "middle", lineHeight: "14px", textDecoration: "none", display: "inline-block" }}>MY PICK</span>
        )}
      </span>
      <span style={{ fontSize: 11, color: "var(--dim)", width: 36, textAlign: "center" }}>{player.team}</span>
      <span style={{ fontSize: 11, color: "var(--dim)", width: 30, textAlign: "center" }}>{player.bye}</span>
      {!struck ? (
        <button
          onClick={(e) => { e.stopPropagation(); onDraft(player); }}
          style={{
            padding: "3px 8px", borderRadius: 4, border: "none", fontSize: 10, fontWeight: 700,
            background: "var(--green)", color: "#000", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >Draft</button>
      ) : isDrafted ? (
        <button
          onClick={(e) => { e.stopPropagation(); onUndraft(player.id); }}
          style={{
            padding: "3px 8px", borderRadius: 4, border: "none", fontSize: 10, fontWeight: 700,
            background: "var(--red)", color: "#fff", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >Undo</button>
      ) : (
        <span style={{ width: 42, flexShrink: 0 }} />
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────
export default function DraftBoard() {
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
  const [showSettings, setShowSettings] = useState(true);
  const [teamSearch, setTeamSearch] = useState("");
  const [csvStatus, setCsvStatus] = useState("");
  const [customRankings, setCustomRankings] = useState(null);
  const chatEndRef = { current: null };

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const savedTeam = localStorage.getItem("depthchart-myteam");
      if (savedTeam) setMyTeam(JSON.parse(savedTeam));
      const savedStruck = localStorage.getItem("depthchart-struck");
      if (savedStruck) setStruckIds(new Set(JSON.parse(savedStruck)));
    } catch {}
  }, []);

  const round = Math.min(18, Math.floor(struckIds.size / numTeams) + 1);

  // CSV Upload Handler — auto-detects positions from PLAYERS database
  const handleCsvUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result;
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        // Build a lookup from the PLAYERS array
        const lookup = {};
        PLAYERS.forEach(p => { lookup[p.name.toLowerCase()] = p; });
        const ranked = [];
        let matched = 0;
        for (const line of lines) {
          // Try to extract player name — handle "rank, name, team" or just "name" or "name, team"
          const parts = line.split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
          let found = null;
          // Try each part as a potential player name
          for (const part of parts) {
            const key = part.toLowerCase();
            if (lookup[key]) { found = lookup[key]; break; }
            // Fuzzy: check if any player name contains this part or vice versa
            const match = PLAYERS.find(p => p.name.toLowerCase().includes(key) || key.includes(p.name.toLowerCase()));
            if (match && key.length > 4) { found = match; break; }
          }
          if (found && !ranked.some(r => r.id === found.id)) {
            ranked.push({ ...found, customRank: ranked.length + 1 });
            matched++;
          }
        }
        if (matched > 0) {
          setCustomRankings(ranked);
          setCsvStatus(`✓ Imported ${matched} players from ${lines.length} rows`);
        } else {
          setCsvStatus("Error: No matching players found. Check your CSV format.");
        }
      } catch (err) {
        setCsvStatus("Error: Could not parse CSV file.");
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be re-uploaded
    e.target.value = "";
  }, []);

  const toggle = useCallback((id) => {
    setStruckIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const addToTeam = useCallback((player) => {
    setMyTeam(prev => {
      if (prev.some(p => p.id === player.id)) return prev;
      return [...prev, player];
    });
    setStruckIds(prev => { const next = new Set(prev); next.add(player.id); return next; });
  }, []);

  const removeFromTeam = useCallback((id) => {
    setMyTeam(prev => prev.filter(p => p.id !== id));
    setStruckIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  // Sync myTeam and struckIds to localStorage
  useEffect(() => {
    if (myTeam.length > 0) {
      localStorage.setItem("depthchart-myteam", JSON.stringify(myTeam));
    }
  }, [myTeam]);

  useEffect(() => {
    if (struckIds.size > 0) {
      localStorage.setItem("depthchart-struck", JSON.stringify([...struckIds]));
    }
  }, [struckIds]);

  const snakePick = useMemo(() => {
    const slot = draftPos;
    const picks = [];
    for (let r = 1; r <= 18; r++) {
      const isOdd = r % 2 === 1;
      if (draftType === "Linear") {
        picks.push({ round: r, pick: (r - 1) * numTeams + slot });
      } else {
        picks.push({ round: r, pick: isOdd ? (r - 1) * numTeams + slot : r * numTeams - slot + 1 });
      }
    }
    return picks;
  }, [draftPos, numTeams, draftType]);

  const sorted = useMemo(() => {
    if (customRankings && customRankings.length > 0) {
      // Custom-ranked players first in their order, then remaining players by ADP
      const rankedIds = new Set(customRankings.map(p => p.id));
      const remaining = PLAYERS.filter(p => !rankedIds.has(p.id)).sort((a, b) => a.adp - b.adp);
      return [...customRankings, ...remaining];
    }
    return [...PLAYERS].sort((a, b) => a.adp - b.adp);
  }, [customRankings]);
  const available = useMemo(() => sorted.filter(p => !struckIds.has(p.id)), [sorted, struckIds]);

  const filteredPlayers = useMemo(() => {
    let list = sorted;
    if (activeTab === "IDP") list = sorted.filter(p => IDP_POSITIONS.includes(p.pos));
    else if (activeTab !== "Overall" && activeTab !== "My Team" && activeTab !== "Advisor") {
      list = sorted.filter(p => p.pos === activeTab);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q));
    }
    if (hideStruck) list = list.filter(p => !struckIds.has(p.id));
    return list;
  }, [sorted, activeTab, search, struckIds, hideStruck]);

  const rec = useMemo(() => getRecommendation(myTeam, available, round), [myTeam, available, round]);

  const currentPick = snakePick.find(p => p.round === round);

  const MESSAGE_CAP = 20;
  const userMsgCount = chatMessages.filter(m => m.role === "user").length;
  const isAtCap = userMsgCount >= MESSAGE_CAP;

  const sendChat = useCallback(async (userMsg) => {
    if (!userMsg.trim()) return;

    // Enforce message cap
    const currentUserMsgs = chatMessages.filter(m => m.role === "user").length;
    if (currentUserMsgs >= MESSAGE_CAP) return;

    const newMsgs = [...chatMessages, { role: "user", text: userMsg }];
    setChatMessages(newMsgs);
    setChatInput("");
    setChatLoading(true);

    // Progressive delay: first 5 are instant, then adds 1s per message, max 8s
    const delayMs = currentUserMsgs < 5 ? 0 : Math.min((currentUserMsgs - 4) * 1000, 8000);
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    const rosterSummary = myTeam.length > 0
      ? myTeam.map(p => `${p.name} (${p.pos}, ${p.team})`).join(", ")
      : "Empty";
    const topAvail = available.slice(0, 25).map((p, i) => `${i+1}. ${p.name} (${p.pos}, ${p.team}, Tier: ${p.tier}, ADP: ${p.adp})`).join("\n");
    const posCount = pos => myTeam.filter(p => p.pos === pos).length;
    const curPick = snakePick.find(p => p.round === round);
    const crossedOff = sorted.filter(p => struckIds.has(p.id) && !myTeam.some(tp => tp.id === p.id)).map(p => p.name).join(", ");

    const systemPrompt = `You are the Depth Chart Sports draft advisor — an embedded AI assistant in a live fantasy football draft board. Today's date is September 2026. The 2026 NFL season is about to begin.

CRITICAL DATA RULES:
- It is September 2026. The 2025 NFL season is OVER. Players drafted in the 2025 NFL Draft are entering their SECOND year, not their rookie year.
- Players drafted in the 2026 NFL Draft are the actual rookies.
- If you are unsure about a player's current team, role, year in the league, or any recent transaction — use web search. Do NOT guess.
- Never say "as a rookie" about a second-year player. Never assume a player is on the same team as your training data suggests without verifying.
- When asked about a player's situation, search for their current 2026 outlook before answering.

ADVISOR PERSONALITY:
- Be direct, opinionated, and concise. Challenge weak logic but confirm good calls fast.
- You are a thought partner, not a yes-man. Push back when something doesn't make sense.
- Never break character. Never discuss how the app works, how you get data, or suggest API integrations. You are a draft advisor, period.
- If asked about non-fantasy-football topics, redirect: "I'm your draft advisor — let's stay focused on your board."

LEAGUE SETTINGS:
- ${numTeams}-team ${draftType.toLowerCase()} draft, pick ${draftPos} overall
- ${scoringRules ? `Scoring: ${scoringRules}` : "Full PPR (1 pt/reception), 6pt passing TDs, -2 INT, tiered kicker scoring (3/4/5/6 pts by FG distance)"}

DRAFT STRATEGY PREFERENCES:
- QB deprioritized to rounds 6-8 (learned from drafting Josh Allen too early last year)
- Tiered kicker scoring makes kicker streaming more impactful
- Prefers pressure-tested advice over validation

CURRENT BOARD STATE:
- Round: ${round} | Total picks made: ${struckIds.size}
- My roster (${myTeam.length} players): ${rosterSummary}
- Position counts: QB:${posCount("QB")} RB:${posCount("RB")} WR:${posCount("WR")} TE:${posCount("TE")} K:${posCount("K")} DEF:${posCount("DEF")}
- Players drafted by other teams: ${crossedOff || "None yet"}
- Top 25 available players:
${topAvail}

Keep responses under 150 words. No bullet points.`;

    const apiMessages = [];
    for (const m of newMsgs) {
      apiMessages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text });
    }

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
      const reply = data.content?.map(b => b.text || "").join("") || "Couldn't get a response. Try again.";
      setChatMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Connection error — try again." }]);
    }
    setChatLoading(false);
  }, [chatMessages, myTeam, available, round, rec, snakePick]);

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: 692, margin: "0 auto", height: "100vh",
      display: "flex", flexDirection: "column", overflow: "hidden",
      background: "var(--bg)", color: "var(--fg)",
      "--bg": "#0d1117", "--fg": "#e6edf3", "--dim": "#7d8590",
      "--border": "#21262d", "--card": "#161b22", "--accent": "#58a6ff",
      "--struck-bg": "#161b2280", "--green": "#3fb950", "--red": "#f85149",
      "--tab-bg": "#21262d", "--tab-active": "#58a6ff",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 12px 8px", borderBottom: "2px solid var(--accent)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--accent)" }}>Draft Board 2026</h1>
            <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2 }}>{numTeams}-Team {draftType} · Pick {draftPos} · {scoringRules || "Full PPR"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--dim)" }}>Round</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", display: "block", marginTop: 2 }}>{round}</span>
          </div>
        </div>

        {/* Settings */}
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowSettings(!showSettings)} style={{ fontSize: 12, background: "#1f6feb", border: "none", color: "#fff", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: 600 }}>
            ⚙ Draft Settings
          </button>
          <span style={{ fontSize: 11, color: "var(--dim)" }}>{numTeams}-team {draftType} · Pick {draftPos}</span>
          {customRankings && (
            <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              ✓ Custom Rankings
              <button onClick={() => { setCustomRankings(null); setCsvStatus(""); }} style={{ background: "none", border: "none", color: "var(--red)", fontSize: 10, cursor: "pointer", fontWeight: 700, padding: 0 }}>✕</button>
            </span>
          )}
        </div>
        {/* Settings — always rendered, visibility toggled */}
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", alignItems: "flex-start", background: "#161b22", padding: 12, borderRadius: 8, visibility: showSettings ? "visible" : "hidden" }}>
            <label style={{ fontSize: 11, color: "var(--dim)", fontWeight: 600 }}>Teams
              <select value={numTeams} onChange={e => setNumTeams(Number(e.target.value))} style={{ marginLeft: 4, background: "#0d1117", color: "#c9d1d9", border: "1px solid #30363d", borderRadius: 4, padding: "2px 4px", fontSize: 11 }}>
                {[8,10,12,14,16].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11, color: "var(--dim)", fontWeight: 600 }}>Pick
              <select value={draftPos} onChange={e => setDraftPos(Number(e.target.value))} style={{ marginLeft: 4, background: "#0d1117", color: "#c9d1d9", border: "1px solid #30363d", borderRadius: 4, padding: "2px 4px", fontSize: 11 }}>
                {Array.from({length: numTeams}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11, color: "var(--dim)", fontWeight: 600 }}>Type
              <select value={draftType} onChange={e => setDraftType(e.target.value)} style={{ marginLeft: 4, background: "#0d1117", color: "#c9d1d9", border: "1px solid #30363d", borderRadius: 4, padding: "2px 4px", fontSize: 11 }}>
                {["Snake", "Linear", "Auction"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11, color: "var(--dim)", fontWeight: 600, display: "flex", flexDirection: "column" }}>Scoring rules (paste your league's settings)
              <textarea value={scoringRules} onChange={e => setScoringRules(e.target.value)} placeholder="e.g. Full PPR, 6pt passing TDs, -2 INT..." rows={2} style={{ marginTop: 4, background: "#0d1117", color: "#c9d1d9", border: "1px solid #30363d", borderRadius: 4, padding: 4, fontSize: 11, width: 280, resize: "vertical" }} />
            </label>
          </div>
        {/* CSV Import — always visible below settings */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <label style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 6,
            background: "var(--tab-bg)", color: "var(--dim)", fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: "1px solid var(--border)", transition: "all 0.15s",
          }}>
            📄 Import Rankings (CSV)
            <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleCsvUpload} />
          </label>
          {csvStatus && <span style={{ fontSize: 11, color: csvStatus.includes("Error") ? "var(--red)" : "var(--green)" }}>{csvStatus}</span>}
          {!csvStatus && <span style={{ fontSize: 10, color: "var(--dim)", opacity: 0.7 }}>Upload a ranked player list — positions auto-detected</span>}
        </div>
        {/* Team count strip + picks until next + roster targets */}
        <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 11, color: "var(--dim)", flexWrap: "wrap", alignItems: "center" }}>
          {["QB","RB","WR","TE","K","DEF"].map(pos => {
            const posFilter = pos === "IDP" ? IDP_POSITIONS : [pos];
            const count = myTeam.filter(p => posFilter.includes(p.pos)).length;
            return (
              <span key={pos} style={{ color: count > 0 ? "var(--green)" : "var(--dim)" }}>
                {pos}:{count}
              </span>
            );
          })}
          <span style={{ color: "var(--accent)", fontWeight: 600, marginLeft: "auto" }}>
            {(() => {
              const pu = getPicksUntilNext(struckIds.size, numTeams, draftPos, draftType);
              if (!pu) return draftType === "Auction" ? "Auction" : "Draft complete";
              if (pu.isMyPick) return "🟢 ON THE CLOCK";
              return `${pu.picksAway} pick${pu.picksAway !== 1 ? "s" : ""} til next (#${pu.nextPick})`;
            })()}
          </span>
        </div>
        {/* Roster construction target */}
        {(() => {
          const targetRound = Object.keys(ROSTER_TARGETS).map(Number).sort((a,b)=>a-b).find(r => r >= round);
          if (!targetRound) return null;
          const t = ROSTER_TARGETS[targetRound];
          return (
            <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 4, opacity: 0.7 }}>
              Target by Rd {targetRound}: RB {t.RB} · WR {t.WR} · TE {t.TE} · QB {t.QB}
            </div>
          );
        })()}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", overflowX: "auto", gap: 2, padding: "6px 8px", background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: "5px 10px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600,
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              background: activeTab === tab ? "var(--tab-active)" : "transparent",
              color: activeTab === tab ? "#fff" : "var(--dim)",
              transition: "all 0.15s",
            }}
          >{tab}</button>
        ))}
      </div>

      {/* Search + filter */}
      {!["My Team", "Advisor"].includes(activeTab) && (
        <div style={{ display: "flex", gap: 8, padding: "8px 12px", alignItems: "center" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search players..."
            style={{
              flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)",
              background: "var(--card)", color: "var(--fg)", fontSize: 13, outline: "none",
            }}
          />
          <label style={{ fontSize: 11, color: "var(--dim)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={hideStruck} onChange={e => setHideStruck(e.target.checked)} />
            Hide struck
          </label>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
      {activeTab === "Advisor" ? (
        <div style={{ padding: 16 }}>
          <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--accent)", padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
              Round {round} Recommendation — Pick #{currentPick?.pick}
            </div>
            {rec.pick ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <PosBadge pos={rec.pick.pos} />
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{rec.pick.name}</span>
                  <span style={{ fontSize: 12, color: "var(--dim)" }}>{rec.pick.team}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.5, margin: "10px 0 12px" }}>{rec.reason}</p>

                {/* Injury warning */}
                {(() => { const inj = INJURIES[rec.pick.name]; return inj ? (
                  <div style={{ padding: "8px 10px", borderRadius: 6, marginBottom: 8, fontSize: 12, lineHeight: 1.4,
                    background: inj.status === "O" || inj.status === "S" ? "#f8514920" : "#d2992220",
                    border: `1px solid ${inj.status === "O" || inj.status === "S" ? "#f85149" : "#d29922"}`,
                    color: inj.status === "O" || inj.status === "S" ? "#f85149" : "#d29922",
                  }}>
                    <span style={{ fontWeight: 700 }}>{inj.status === "O" ? "OUT" : inj.status === "S" ? "EXEMPT" : "INJURY"}</span> {inj.note}
                  </div>
                ) : null; })()}

                {/* Bye week stacking warning */}
                {(() => { const bw = checkByeConflict(myTeam, rec.pick); return bw ? (
                  <div style={{ padding: "8px 10px", borderRadius: 6, marginBottom: 8, fontSize: 12, lineHeight: 1.4,
                    background: "#d2992220", border: "1px solid #d29922", color: "#d29922",
                  }}>
                    <span style={{ fontWeight: 700 }}>BYE STACK</span> Drafting {rec.pick.name} gives you {bw.count} starters on bye week {bw.bye} ({bw.players.join(", ")})
                  </div>
                ) : null; })()}

                <button onClick={() => { addToTeam(rec.pick); }}
                  style={{
                    background: "var(--green)", color: "#000", border: "none", borderRadius: 6,
                    padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%"
                  }}>
                  Draft {rec.pick.name} → Round {Math.min(18, round + 1)}
                </button>
              </>
            ) : <p style={{ color: "var(--dim)" }}>No players available.</p>}
          </div>

          {/* VOR Drop-off Alerts */}
          {(() => {
            const drops = ["RB","WR","TE","QB"].map(pos => ({ pos, ...getDropoff(available, pos) })).filter(d => d.top);
            if (drops.length === 0) return null;
            return (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--dim)", marginBottom: 6 }}>Positional drop-offs</div>
                {drops.map(d => (
                  <div key={d.pos} style={{
                    padding: "5px 10px", borderRadius: 6, marginBottom: 3, fontSize: 12,
                    background: d.severity === "high" ? "#f8514915" : "#d2992215",
                    border: `1px solid ${d.severity === "high" ? "#f8514940" : "#d2992240"}`,
                    color: d.severity === "high" ? "#f85149" : "#d29922",
                  }}>
                    <span style={{ fontWeight: 700 }}>{d.pos}:</span> {d.top} is {d.gap}+ spots ahead of {d.pos}2 — tier cliff after him
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Handcuff reminder */}
          {(() => {
            const cuffs = myTeam.filter(p => HANDCUFFS[p.name]).map(p => ({
              starter: p.name,
              cuff: HANDCUFFS[p.name],
              available: available.some(a => a.name === HANDCUFFS[p.name]),
            })).filter(c => c.available);
            if (cuffs.length === 0 || round < 9) return null;
            return (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--dim)", marginBottom: 6 }}>Handcuff targets</div>
                {cuffs.map(c => (
                  <div key={c.starter} style={{
                    padding: "5px 10px", borderRadius: 6, marginBottom: 3, fontSize: 12,
                    background: "#388bfd15", border: "1px solid #388bfd40", color: "#388bfd",
                  }}>
                    <span style={{ fontWeight: 700 }}>{c.cuff}</span> — insurance for your {c.starter}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Quick alternatives */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--dim)", marginBottom: 8 }}>Also consider:</div>
          {available.slice(0, 5).map((p, i) => {
            const pinj = getInjuryBadge(p.name);
            const psteal = getStealLevel(p, struckIds.size + i + 1);
            return (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
              background: psteal ? `${psteal.color}08` : "var(--card)", borderRadius: 6, marginBottom: 4, cursor: "pointer",
              border: `1px solid ${psteal ? psteal.color + "30" : "var(--border)"}`
            }} onClick={() => { addToTeam(p); }}>
              <span style={{ width: 20, fontSize: 11, color: "var(--dim)" }}>{i + 1}</span>
              <PosBadge pos={p.pos} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                {p.name}
                {pinj && <span title={pinj.note} style={{ display: "inline-block", marginLeft: 4, padding: "0 4px", borderRadius: 3, fontSize: 9, fontWeight: 800, background: pinj.color.bg, color: pinj.color.text, verticalAlign: "middle", lineHeight: "14px" }}>{pinj.label}</span>}
                {psteal && <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 900, color: psteal.color }}>{psteal.label}</span>}
              </span>
              <span style={{ fontSize: 11, color: "var(--dim)" }}>{p.team}</span>
              <span style={{ fontSize: 11, color: "var(--green)" }}>Draft</span>
            </div>
            );
          })}

          {/* ── Chat Dialogue ── */}
          <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>Talk it out</div>
              <div style={{
                fontSize: 11, fontWeight: 600,
                color: userMsgCount >= MESSAGE_CAP ? "var(--red)" : userMsgCount >= MESSAGE_CAP - 5 ? "#d29922" : "var(--dim)",
              }}>
                {userMsgCount}/{MESSAGE_CAP} questions
              </div>
            </div>

            {/* Messages */}
            <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 8 }}>
              {chatMessages.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--dim)", padding: "8px 0", lineHeight: 1.5 }}>
                  Ask me anything — "Why not take a WR here?", "What if I grab McBride instead?", "Who's the best RB available after round 4?"
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} style={{
                  marginBottom: 8, display: "flex", flexDirection: "column",
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                }}>
                  <div style={{
                    padding: "8px 12px", borderRadius: 10, maxWidth: "88%", fontSize: 13, lineHeight: 1.5,
                    background: m.role === "user" ? "var(--accent)" : "var(--card)",
                    color: m.role === "user" ? "#000" : "var(--fg)",
                    border: m.role === "user" ? "none" : "1px solid var(--border)",
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--dim)", fontStyle: "italic" }}>
                  Thinking...
                </div>
              )}
              <div ref={el => { chatEndRef.current = el; if (el) el.scrollIntoView({ behavior: "smooth" }); }} />
            </div>

            {/* Cap reached message */}
            {isAtCap && (
              <div style={{
                padding: "10px 12px", borderRadius: 8, marginBottom: 8, fontSize: 12, lineHeight: 1.4,
                background: "#f8514915", border: "1px solid #f8514940", color: "#f85149", textAlign: "center",
              }}>
                You've used all {MESSAGE_CAP} questions for this session. Upgrade to Front Office for more.
              </div>
            )}

            {/* Input */}
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !chatLoading && !isAtCap) sendChat(chatInput); }}
                placeholder={isAtCap ? "Message limit reached" : "Debate a pick..."}
                disabled={chatLoading || isAtCap}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
                  background: "var(--card)", color: "var(--fg)", fontSize: 13, outline: "none",
                  opacity: isAtCap ? 0.5 : 1,
                }}
              />
              <button
                onClick={() => sendChat(chatInput)}
                disabled={chatLoading || !chatInput.trim() || isAtCap}
                style={{
                  padding: "8px 14px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13,
                  background: chatLoading || !chatInput.trim() || isAtCap ? "var(--tab-bg)" : "var(--accent)",
                  color: chatLoading || !chatInput.trim() || isAtCap ? "var(--dim)" : "#000",
                  cursor: chatLoading || !chatInput.trim() || isAtCap ? "default" : "pointer",
                }}
              >Send</button>
            </div>
          </div>
        </div>
      ) : activeTab === "My Team" ? (
        <div style={{ padding: 16 }}>
          {/* Search + Add Player */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Add Player</div>
            <input
              value={teamSearch}
              onChange={e => setTeamSearch(e.target.value)}
              placeholder="Search to add a player..."
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)",
                background: "var(--card)", color: "var(--fg)", fontSize: 13, outline: "none", boxSizing: "border-box",
              }}
            />
            {teamSearch.trim() && (
              <div style={{ maxHeight: 160, overflowY: "auto", marginTop: 4, borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)" }}>
                {sorted
                  .filter(p => !myTeam.some(tp => tp.id === p.id))
                  .filter(p => p.name.toLowerCase().includes(teamSearch.toLowerCase()) || p.team.toLowerCase().includes(teamSearch.toLowerCase()))
                  .slice(0, 8)
                  .map(p => (
                    <div key={p.id} onClick={() => { addToTeam(p); setTeamSearch(""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", cursor: "pointer",
                        borderBottom: "1px solid var(--border)", transition: "background 0.1s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--tab-bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <PosBadge pos={p.pos} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: "var(--dim)" }}>{p.team}</span>
                      <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 700 }}>+ Add</span>
                    </div>
                  ))}
                {sorted.filter(p => !myTeam.some(tp => tp.id === p.id)).filter(p => p.name.toLowerCase().includes(teamSearch.toLowerCase()) || p.team.toLowerCase().includes(teamSearch.toLowerCase())).length === 0 && (
                  <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--dim)" }}>No matching players found</div>
                )}
              </div>
            )}
          </div>

          {/* Roster */}
          {myTeam.length === 0 ? (
            <p style={{ color: "var(--dim)", fontSize: 13, textAlign: "center", padding: 32 }}>
              No players drafted yet. Hit the Draft button on any player or search above.
            </p>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 8 }}>{myTeam.length} player{myTeam.length !== 1 ? "s" : ""} drafted</div>
              {["QB","RB","WR","TE","K","DEF"].map(pos => {
                const posPlayers = myTeam.filter(p => p.pos === pos);
                if (posPlayers.length === 0) return null;
                return (
                  <div key={pos} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 4, textTransform: "uppercase" }}>{pos}</div>
                    {posPlayers.map((p, idx) => (
                      <div key={p.id} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                        background: "var(--card)", borderRadius: 6, marginBottom: 3,
                        border: "1px solid var(--border)"
                      }}>
                        <span style={{ fontSize: 10, color: "var(--dim)", width: 16, textAlign: "center" }}>{idx + 1}</span>
                        <PosBadge pos={p.pos} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                        <span style={{ fontSize: 11, color: "var(--dim)" }}>{p.team}</span>
                        <button onClick={() => removeFromTeam(p.id)}
                          style={{ background: "none", border: "none", color: "var(--red)", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>✕</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : (
        <div>
          {/* Column headers */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "4px 12px",
            fontSize: 10, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 0.5,
            borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 1
          }}>
            <span style={{ width: 32, textAlign: "right" }}>#</span>
            <span style={{ width: 30 }}>Pos</span>
            <span style={{ flex: 1 }}>Player</span>
            <span style={{ width: 36, textAlign: "center" }}>Team</span>
            <span style={{ width: 30, textAlign: "center" }}>Bye</span>
          </div>
          {filteredPlayers.map((p, i) => {
            const sl = !struckIds.has(p.id) ? getStealLevel(p, struckIds.size + i + 1) : null;
            return (
            <PlayerRow
              key={p.id}
              player={p}
              rank={i + 1}
              struck={struckIds.has(p.id)}
              onToggle={toggle}
              compact={activeTab === "Overall"}
              stealLevel={sl}
              onDraft={(player) => { addToTeam(player); }}
              onUndraft={removeFromTeam}
              isDrafted={myTeam.some(tp => tp.id === p.id)}
            />
            );
          })}
          {filteredPlayers.length === 0 && (
            <p style={{ color: "var(--dim)", fontSize: 13, textAlign: "center", padding: 32 }}>No players match.</p>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

