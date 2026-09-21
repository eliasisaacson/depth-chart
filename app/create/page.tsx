"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

const ALLOWED_EMAIL = "elias.isaacson@gmail.com";

const SPORTS = ["NBA", "NFL"];

const CONTENT_TYPES = [
  { id: "draft-strategy", label: "Draft Strategy", desc: "Pre-draft analysis and player rankings takes" },
  { id: "waiver-wire", label: "Waiver Wire", desc: "Pickups and drops for this week" },
  { id: "start-sit", label: "Start/Sit", desc: "Who to start and who to bench" },
  { id: "trade-analysis", label: "Trade Analysis", desc: "Evaluate a trade or propose targets" },
  { id: "injury-impact", label: "Injury Impact", desc: "How an injury reshuffles rankings" },
  { id: "weekly-preview", label: "Weekly Preview", desc: "Matchups, streamers, and schedule plays" },
  { id: "rankings-take", label: "Hot Take", desc: "A bold, contrarian rankings opinion" },
  { id: "player-spotlight", label: "Player Spotlight", desc: "Deep dive on one player's fantasy outlook" },
];

const OUTPUT_FORMATS = [
  { id: "substack", label: "Substack Article", desc: "800-1500 words, structured with headers" },
  { id: "twitter", label: "X / Twitter Thread", desc: "3-8 tweets, hook opener, numbered takes" },
  { id: "instagram", label: "Instagram Caption", desc: "Punchy single post with hashtags" },
];

const TONES = [
  { id: "analytical", label: "Analytical", desc: "Data-driven, measured" },
  { id: "hot-take", label: "Hot Take", desc: "Bold, provocative, confident" },
  { id: "casual", label: "Casual", desc: "Conversational, fun, relatable" },
];

export default function ContentGenerator() {
  const { user, isLoaded } = useUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  const isAuthorized = userEmail === ALLOWED_EMAIL;

  const [sport, setSport] = useState("NBA");
  const [contentType, setContentType] = useState("draft-strategy");
  const [format, setFormat] = useState("substack");
  const [tone, setTone] = useState("analytical");
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setOutput("");
    setCopied(false);

    const contentLabel = CONTENT_TYPES.find(c => c.id === contentType)?.label || contentType;
    const formatLabel = OUTPUT_FORMATS.find(f => f.id === format)?.label || format;
    const toneLabel = TONES.find(t => t.id === tone)?.label || tone;

    const formatInstructions = {
      substack: `Write a Substack article (800-1500 words). Structure with a compelling headline, an intro hook that grabs fantasy players, 3-5 sections with headers, data-backed analysis, and a conclusion with actionable takeaways. End with a subtle plug: "Built with Depth Chart Sports — try the AI draft advisor at depthchartsports.app"`,
      twitter: `Write an X/Twitter thread (5-8 tweets). Start with a hook tweet that stops the scroll. Number each take (1/, 2/, etc.). Keep each tweet under 280 characters. End with a CTA: "Want an AI co-pilot for your draft? depthchartsports.app 🏀"`,
      instagram: `Write an Instagram caption (150-300 words). Start with a bold opener. Use short paragraphs. Include 2-3 emoji naturally (not forced). End with a CTA and include 8-12 relevant hashtags on a separate line.`,
    };

    const systemPrompt = `You are the head writer for Depth Chart Sports, a fantasy sports content brand. You write ${sport} fantasy content that is sharp, opinionated, and backed by current data.

CRITICAL: The current date is October 2026. For NBA, the 2026-27 season is about to begin. For NFL, the 2026 season is underway. Use web search to get the latest news, stats, injuries, and transactions before writing. Do NOT use outdated information.

VOICE: ${toneLabel} tone. You are a fantasy expert who respects the reader's intelligence. No fluff, no obvious takes, no "in conclusion" language. Write like you're texting a smart friend who plays fantasy, not like you're writing a term paper.

CONTENT TYPE: ${contentLabel}
OUTPUT FORMAT: ${formatLabel}
SPORT: ${sport}

${formatInstructions[format]}

IMPORTANT RULES:
- Search the web for current ${sport} fantasy news, stats, and player situations before writing
- Every claim should be grounded in real, current data
- Name specific players, matchups, and stats — no vague generalities
- If writing about a specific topic the user provides, stay focused on it
- Include the Depth Chart Sports branding naturally at the end — don't make it feel like an ad`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          max_tokens: format === "substack" ? 4000 : 1500,
          messages: [
            { role: "user", content: `Write a ${contentLabel.toLowerCase()} piece about: ${topic}` }
          ],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((b: any) => b.text || "").join("\n") || "Couldn't generate content. Try again.";
      setOutput(text);
    } catch {
      setOutput("Connection error — try again.");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoaded) return null;
  if (!isAuthorized) return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#090b10", color: "#7d8590", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 14 }}>Page not found.</div>
      </div>
    </div>
  );

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: "#090b10", color: "#c9d1d9", minHeight: "100vh",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px", borderBottom: "2px solid #f97316",
        maxWidth: 1100, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#f97316" }}>✍️ Content Generator</h1>
          <div style={{ fontSize: 11, color: "#7d8590", marginTop: 2 }}>AI-powered fantasy content for Substack, X, and Instagram</div>
        </div>
        <a href="/" style={{ fontSize: 12, color: "#7d8590", textDecoration: "none" }}>← Back to home</a>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px", display: "flex", gap: 20 }}>

        {/* ── LEFT: Controls ── */}
        <div style={{ width: 320, flexShrink: 0 }}>
          {/* Sport */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3", display: "block", marginBottom: 6 }}>Sport</label>
            <div style={{ display: "flex", gap: 6 }}>
              {SPORTS.map(s => (
                <button key={s} onClick={() => setSport(s)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: sport === s ? "#f97316" : "#161b22",
                  color: sport === s ? "#000" : "#7d8590",
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Content Type */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3", display: "block", marginBottom: 6 }}>Content Type</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {CONTENT_TYPES.map(c => (
                <button key={c.id} onClick={() => setContentType(c.id)} style={{
                  padding: "8px 12px", borderRadius: 6, border: "none", textAlign: "left", cursor: "pointer",
                  background: contentType === c.id ? "#f9731620" : "#161b22",
                  border: contentType === c.id ? "1px solid #f9731640" : "1px solid #21262d",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: contentType === c.id ? "#f97316" : "#e6edf3" }}>{c.label}</div>
                  <div style={{ fontSize: 10, color: "#484f58", marginTop: 2 }}>{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Output Format */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3", display: "block", marginBottom: 6 }}>Output Format</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {OUTPUT_FORMATS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)} style={{
                  padding: "8px 12px", borderRadius: 6, border: "none", textAlign: "left", cursor: "pointer",
                  background: format === f.id ? "#f9731620" : "#161b22",
                  border: format === f.id ? "1px solid #f9731640" : "1px solid #21262d",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: format === f.id ? "#f97316" : "#e6edf3" }}>{f.label}</div>
                  <div style={{ fontSize: 10, color: "#484f58", marginTop: 2 }}>{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3", display: "block", marginBottom: 6 }}>Tone</label>
            <div style={{ display: "flex", gap: 6 }}>
              {TONES.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: tone === t.id ? "#f97316" : "#161b22",
                  color: tone === t.id ? "#000" : "#7d8590",
                }}>{t.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Topic + Output ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Topic input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3", display: "block", marginBottom: 6 }}>What should we write about?</label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={sport === "NBA"
                ? "e.g. Victor Wembanyama's fantasy ceiling in year 2, punt FT% builds for 9-cat leagues, top 10 sleepers outside the first 5 rounds..."
                : "e.g. Week 3 waiver wire pickups, trade targets after Bijan Robinson's bye week..."
              }
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #21262d",
                background: "#161b22", color: "#e6edf3", fontSize: 13, resize: "vertical",
                outline: "none", boxSizing: "border-box", lineHeight: 1.5,
              }}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            style={{
              padding: "12px 0", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700,
              cursor: loading || !topic.trim() ? "default" : "pointer", marginBottom: 16, width: "100%",
              background: loading || !topic.trim() ? "#21262d" : "#f97316",
              color: loading || !topic.trim() ? "#484f58" : "#000",
            }}
          >
            {loading ? "Generating... (searching the web for current data)" : "Generate Content"}
          </button>

          {/* Output */}
          {output && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3" }}>Output</div>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: "4px 12px", borderRadius: 4, border: "1px solid #21262d",
                    background: copied ? "#3fb950" : "#161b22",
                    color: copied ? "#000" : "#c9d1d9",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}
                >{copied ? "✓ Copied!" : "Copy to clipboard"}</button>
              </div>
              <div style={{
                flex: 1, padding: "16px 20px", borderRadius: 8, border: "1px solid #21262d",
                background: "#0d1117", overflowY: "auto", whiteSpace: "pre-wrap",
                fontSize: 13, lineHeight: 1.7, color: "#c9d1d9", minHeight: 300,
              }}>
                {output}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!output && !loading && (
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px dashed #21262d", borderRadius: 8, minHeight: 300,
            }}>
              <div style={{ textAlign: "center", color: "#484f58" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✍️</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Pick a content type, set your topic, and hit generate.</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>The AI will search the web for current data before writing.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
