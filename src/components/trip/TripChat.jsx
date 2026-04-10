import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, BarChart2, X, Plus, Menu, ExternalLink, MessageCircle, Zap } from "lucide-react";
import CreateDecisionPromptSheet from "./CreateDecisionPromptSheet";
import DecisionPromptCard from "./DecisionPromptCard";
import { format } from "date-fns";

const URL_REGEX = /https?:\/\/[^\s]+/gi;

function detectUrl(text) {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

function UserAvatar({ name }) {
  const initials = (name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const palette = ["#C8A27C", "#A0856A", "#B89060", "#9A7055", "#D4AE8A"];
  const bg = palette[(initials.charCodeAt(0) || 0) % palette.length];
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white", fontSize: 10, fontWeight: 700 }}>
      {initials}
    </div>
  );
}

const CATEGORY_COLORS = { cafe: "#A07850", restaurant: "#C87050", hotel: "#7090B0", museum: "#8060A0", activity: "#508060", bar: "#906080", other: "#9A8A7A" };

const PLATFORM_MAP = [
  { match: /tiktok\.com/, name: "TikTok Video", icon: "🎵" },
  { match: /instagram\.com/, name: "Instagram Post", icon: "📸" },
  { match: /twitter\.com|x\.com/, name: "X Post", icon: "🐦" },
  { match: /youtube\.com|youtu\.be/, name: "YouTube Video", icon: "▶️" },
  { match: /maps\.google\.com|google\.com\/maps/, name: "Google Maps", icon: "📍" },
  { match: /airbnb\.com/, name: "Airbnb Listing", icon: "🏠" },
  { match: /booking\.com/, name: "Booking.com", icon: "🏨" },
  { match: /tripadvisor\.com/, name: "TripAdvisor", icon: "⭐" },
  { match: /yelp\.com/, name: "Yelp", icon: "🍽️" },
  { match: /spotify\.com/, name: "Spotify", icon: "🎧" },
];

function detectPlatform(url) {
  if (!url) return null;
  return PLATFORM_MAP.find(p => p.match.test(url)) || null;
}

function cleanDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function LinkCard({ msg }) {
  const platform = detectPlatform(msg.link_url);
  const hasMetadata = msg.link_title && !msg.link_title.toLowerCase().includes("unable") && !msg.link_title.toLowerCase().includes("error") && !msg.link_title.toLowerCase().includes("cannot");
  const displayTitle = hasMetadata ? msg.link_title : (platform ? platform.name : "Shared Link");
  const displaySummary = hasMetadata && msg.link_summary && !msg.link_summary.toLowerCase().includes("unable") && !msg.link_summary.toLowerCase().includes("error") ? msg.link_summary : null;
  const domain = cleanDomain(msg.link_url);

  return (
    <a href={msg.link_url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none" }}>
      <div style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(200,162,124,0.2)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        {msg.content && msg.content !== msg.link_url && (
          <p style={{ margin: 0, padding: "10px 12px 0", fontSize: 13, color: "#3A3028" }}>{msg.content}</p>
        )}
        <div style={{ padding: "10px 12px 11px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {platform && !hasMetadata && <span style={{ fontSize: 13 }}>{platform.icon}</span>}
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#2A2018", lineHeight: 1.35 }}>{displayTitle}</p>
          </div>
          {displaySummary && (
            <p style={{ margin: 0, fontSize: 11, color: "#9A8A7A", lineHeight: 1.45 }}>{displaySummary}</p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <ExternalLink size={9} color="#C8A27C" />
            <span style={{ fontSize: 10, color: "#C0B0A0" }}>{domain}</span>
            {msg.link_category && hasMetadata && (
              <span style={{ marginLeft: 4, padding: "1px 7px", borderRadius: 20, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "white", background: CATEGORY_COLORS[msg.link_category] || CATEGORY_COLORS.other }}>
                {msg.link_category}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

function PollCard({ msg, user, onVote }) {
  const votes = msg.poll_votes || {};
  const total = Object.values(votes).reduce((s, arr) => s + (arr?.length || 0), 0);
  const userVoteIdx = msg.poll_options?.findIndex((_, i) => votes[i]?.includes(user?.email));

  return (
    <div style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(200,162,124,0.22)", borderRadius: 16, padding: "12px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <BarChart2 size={13} color="#C8A27C" />
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2A2018" }}>{msg.poll_question}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {(msg.poll_options || []).map((opt, i) => {
          const count = votes[i]?.length || 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          const isVoted = userVoteIdx === i;
          return (
            <button key={i} onClick={() => onVote(msg, i)} style={{ position: "relative", background: "transparent", border: `1px solid ${isVoted ? "rgba(200,162,124,0.55)" : "rgba(200,162,124,0.18)"}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", padding: 0 }}>
              <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${pct}%`, background: isVoted ? "rgba(200,162,124,0.18)" : "rgba(200,162,124,0.07)", transition: "width 0.4s ease", borderRadius: 10 }} />
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px" }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#3A3028" }}>{opt}</span>
                <span style={{ fontSize: 10, fontWeight: 500, color: isVoted ? "#C8A27C" : "#B0A090" }}>{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 10, color: "#C0B0A0" }}>{total} vote{total !== 1 ? "s" : ""}</p>
    </div>
  );
}

function HubPanel({ messages, user, prompts, onVote, onClose, onStartVote }) {
  const [section, setSection] = useState("links");
  const links = messages.filter(m => m.message_type === "link");
  const polls = messages.filter(m => m.message_type === "poll");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.22)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", width: "88%", maxWidth: 300, height: "100%", background: "rgba(250,246,241,0.97)", backdropFilter: "blur(20px)", boxShadow: "-4px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 20px 16px" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#2A2018" }}>Trip Hub</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(200,162,124,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#9A8A7A" />
          </button>
        </div>
        <div style={{ display: "flex", gap: 4, margin: "0 20px 16px", padding: 4, background: "rgba(200,162,124,0.1)", borderRadius: 999 }}>
          {["links", "polls", "votes"].map(s => (
            <button key={s} onClick={() => setSection(s)} style={{ flex: 1, padding: "6px 0", fontSize: 12, fontWeight: 500, borderRadius: 999, border: "none", cursor: "pointer", textTransform: "capitalize", background: section === s ? "#C8A27C" : "transparent", color: section === s ? "white" : "#9A8A7A", transition: "all 0.2s" }}>
              {s === "votes" ? `votes (${prompts?.length || 0})` : `${s} (${s === "links" ? links.length : polls.length})`}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
          {section === "links" && (links.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#C0B0A0" }}>No links shared yet</p>
            </div>
          ) : links.map(msg => (
            <div key={msg.id}>
              <LinkCard msg={msg} />
              <p style={{ margin: "4px 0 0 4px", fontSize: 10, color: "#C0B0A0" }}>by {msg.sender_name?.split(" ")[0] || "someone"}</p>
            </div>
          )))}
          {section === "polls" && (polls.length === 0 ? (
           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, textAlign: "center" }}>
             <p style={{ margin: 0, fontSize: 12, color: "#C0B0A0" }}>No polls yet</p>
           </div>
          ) : polls.map(msg => (
           <PollCard key={msg.id} msg={msg} user={user} onVote={onVote} />
          )))}
          {section === "votes" && (prompts?.length === 0 ? (
           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, textAlign: "center" }}>
             <p style={{ margin: 0, fontSize: 12, color: "#C0B0A0" }}>No votes yet</p>
             <button onClick={onStartVote} style={{ marginTop: 12, fontSize: 11, padding: "6px 14px", borderRadius: 999, background: "#C8A27C", color: "white", border: "none", cursor: "pointer", fontWeight: 500 }}>
               Start one
             </button>
           </div>
          ) : prompts.map(prompt => (
           <div key={prompt.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
             <DecisionPromptCard prompt={prompt} />
           </div>
          )))}
        </div>
      </div>
    </div>
  );
}

export default function TripChat({ trip, user }) {
  if (!trip || !user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 24, height: 24, border: "2px solid rgba(200,162,124,0.3)", borderTopColor: "#C8A27C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState("text");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [showPanel, setShowPanel] = useState(false);
  const [showCreateVote, setShowCreateVote] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.TripMessage.filter({ trip_id: trip.id }, "created_date", 200),
      base44.entities.DecisionPrompt.filter({ trip_id: trip.id }, "-created_date", 200),
    ]).then(([msgs, prts]) => {
      setMessages(msgs || []);
      setPrompts(prts || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    const unsub1 = base44.entities.TripMessage.subscribe((event) => {
      if (event.data?.trip_id === trip.id) {
        setMessages(prev => {
          if (event.type === "create") return [...prev, event.data];
          if (event.type === "update") return prev.map(m => m.id === event.id ? event.data : m);
          if (event.type === "delete") return prev.filter(m => m.id !== event.id);
          return prev;
        });
      }
    });

    const unsub2 = base44.entities.DecisionPrompt.subscribe((event) => {
      if (event.data?.trip_id === trip.id) {
        setPrompts(prev => {
          if (event.type === "create") return [...prev, event.data];
          if (event.type === "update") return prev.map(p => p.id === event.id ? event.data : p);
          if (event.type === "delete") return prev.filter(p => p.id !== event.id);
          return prev;
        });
      }
    });

    return () => { unsub1?.(); unsub2?.(); };
  }, [trip.id]);

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e) {
    e?.preventDefault();
    if (sending) return;

    if (mode === "poll") {
      const opts = pollOptions.filter(o => o.trim());
      if (!pollQuestion.trim() || opts.length < 2) return;
      setSending(true);
      await base44.entities.TripMessage.create({
        trip_id: trip.id, sender_email: user.email, sender_name: user.full_name,
        content: pollQuestion.trim(), message_type: "poll",
        poll_question: pollQuestion.trim(), poll_options: opts, poll_votes: {},
      });
      setPollQuestion(""); setPollOptions(["", ""]); setMode("text");
      setSending(false);
      return;
    }

    if (!text.trim()) return;
    setSending(true);
    const detectedUrl = detectUrl(text);

    if (detectedUrl) {
      let title = "", summary = "", category = "other";
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `For this URL: ${detectedUrl}\nIf you can access the page, return JSON with: title (short place/page name, max 5 words, no error messages), summary (one casual sentence max 12 words describing the content, no error messages), category (one of: cafe, restaurant, hotel, museum, activity, bar, other). If you cannot access the page, return empty strings for title and summary.`,
          add_context_from_internet: true,
          response_json_schema: { type: "object", properties: { title: { type: "string" }, summary: { type: "string" }, category: { type: "string" } } }
        });
        if (res?.title && !res.title.toLowerCase().includes("unable") && !res.title.toLowerCase().includes("cannot")) title = res.title;
        if (res?.summary && !res.summary.toLowerCase().includes("unable") && !res.summary.toLowerCase().includes("cannot")) summary = res.summary;
        if (res?.category) category = res.category;
      } catch {}
      await base44.entities.TripMessage.create({
        trip_id: trip.id, sender_email: user.email, sender_name: user.full_name,
        content: text.replace(detectedUrl, "").trim() || detectedUrl,
        message_type: "link", link_url: detectedUrl,
        link_title: title, link_summary: summary, link_category: category,
      });
    } else {
      await base44.entities.TripMessage.create({
        trip_id: trip.id, sender_email: user.email, sender_name: user.full_name,
        content: text.trim(), message_type: "text",
      });
    }
    setText("");
    setSending(false);
  }

  async function handleVote(msg, optionIndex) {
    const votes = { ...(msg.poll_votes || {}) };
    Object.keys(votes).forEach(k => { votes[k] = (votes[k] || []).filter(e => e !== user.email); });
    if (!votes[optionIndex]) votes[optionIndex] = [];
    votes[optionIndex].push(user.email);
    await base44.entities.TripMessage.update(msg.id, { poll_votes: votes });
  }

  // Group messages by date (local timezone)
  const grouped = [];
  let lastDate = null;
  messages.forEach(msg => {
    const d = msg.created_date ? new Date(msg.created_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : null;
    if (d && d !== lastDate) { grouped.push({ type: "date", label: d }); lastDate = d; }
    grouped.push({ type: "msg", msg });
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 24, height: 24, border: "2px solid rgba(200,162,124,0.3)", borderTopColor: "#C8A27C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 340px)", minHeight: 400 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C8A27C" }}>Group Chat</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowCreateVote(true)} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(200,162,124,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={16} color="#C8A27C" />
          </button>
          <button onClick={() => setShowPanel(true)} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(200,162,124,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Menu size={16} color="#C8A27C" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }}>
        {messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", paddingBottom: 40 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(200,162,124,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <MessageCircle size={24} color="#C8A27C" />
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: "#3A3028" }}>Start the conversation</p>
            <p style={{ margin: 0, fontSize: 12, color: "#B0A090" }}>Share ideas, links, and plans with your group.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {grouped.map((item, i) => {
              if (item.type === "date") {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(200,162,124,0.12)" }} />
                    <span style={{ fontSize: 10, color: "#C0B0A0" }}>{item.label}</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(200,162,124,0.12)" }} />
                  </div>
                );
              }

              const msg = item.msg;
              const isMe = msg.sender_email === user?.email;
              const isPoll = msg.message_type === "poll";
              const isLink = msg.message_type === "link";

              if (isPoll) {
                return (
                  <div key={msg.id} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <UserAvatar name={msg.sender_name} />
                      <span style={{ fontSize: 10, color: "#B0A090" }}>{msg.sender_name?.split(" ")[0]} · poll</span>
                    </div>
                    <PollCard msg={msg} user={user} onVote={handleVote} />
                  </div>
                );
              }

              return (
                <div key={msg.id} style={{ display: "flex", gap: 6, justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 2 }}>
                  {!isMe && <div style={{ marginTop: 4 }}><UserAvatar name={msg.sender_name} /></div>}
                  <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    {!isMe && (
                      <span style={{ fontSize: 10, color: "#C0B0A0", marginBottom: 3, marginLeft: 2 }}>
                        {msg.sender_name?.split(" ")[0] || msg.sender_email?.split("@")[0]}
                      </span>
                    )}
                    {isLink ? (
                      <div style={{ width: "100%" }}><LinkCard msg={msg} /></div>
                    ) : (
                      <div style={{
                        padding: "8px 14px", borderRadius: 18, fontSize: 13, lineHeight: 1.5,
                        ...(isMe
                          ? { background: "#C8A27C", color: "white", borderBottomRightRadius: 5 }
                          : { background: "rgba(255,255,255,0.82)", border: "1px solid rgba(200,162,124,0.18)", color: "#3A3028", borderBottomLeftRadius: 5 }
                        )
                      }}>
                        {msg.content}
                      </div>
                    )}
                    {msg.created_date && (
                      <span style={{ fontSize: 9, color: "#C8B8A8", marginTop: 3, marginLeft: 2, marginRight: 2 }}>
                        {new Date(msg.created_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Poll composer */}
      {mode === "poll" && (
        <div style={{ background: "rgba(255,255,255,0.88)", border: "1px solid rgba(200,162,124,0.2)", borderRadius: 16, padding: 14, marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#3A3028" }}>New Poll</span>
            <button onClick={() => setMode("text")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><X size={16} color="#9A8A7A" /></button>
          </div>
          <input style={{ width: "100%", fontSize: 13, borderRadius: 10, padding: "8px 12px", background: "rgba(200,162,124,0.08)", border: "none", outline: "none", color: "#3A3028", marginBottom: 8, boxSizing: "border-box" }}
            placeholder="Ask a question…" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
          {pollOptions.map((opt, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <input style={{ flex: 1, fontSize: 13, borderRadius: 10, padding: "6px 12px", background: "rgba(200,162,124,0.08)", border: "none", outline: "none", color: "#3A3028" }}
                placeholder={`Option ${i + 1}`} value={opt}
                onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }} />
              {pollOptions.length > 2 && (
                <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                  <X size={14} color="#B0A090" />
                </button>
              )}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <button onClick={() => setPollOptions([...pollOptions, ""])} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#C8A27C", fontWeight: 500 }}>
              <Plus size={12} /> Add option
            </button>
            <button onClick={sendMessage} disabled={sending || !pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
              style={{ fontSize: 12, fontWeight: 600, padding: "6px 18px", borderRadius: 999, border: "none", cursor: "pointer", background: "#C8A27C", color: "white", opacity: sending ? 0.5 : 1 }}>
              Post Poll
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      {mode === "text" && (
        <form onSubmit={sendMessage} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(200,162,124,0.1)" }}>
          <button type="button" onClick={() => setMode("poll")} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(200,162,124,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BarChart2 size={15} color="#C8A27C" />
          </button>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={sending ? "Processing…" : "Message or paste a link…"}
            autoComplete="off"
            style={{ flex: 1, borderRadius: 999, padding: "9px 16px", fontSize: 13, background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.18)", outline: "none", color: "#3A3028" }}
          />
          <button type="submit" disabled={sending || !text.trim()} style={{ width: 36, height: 36, borderRadius: "50%", background: "#C8A27C", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: (sending || !text.trim()) ? 0.4 : 1 }}>
            {sending
              ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              : <Send size={15} color="white" />
            }
          </button>
        </form>
      )}

      {showPanel && <HubPanel messages={messages} user={user} prompts={prompts} onVote={handleVote} onClose={() => setShowPanel(false)} onStartVote={() => { setShowPanel(false); setShowCreateVote(true); }} />}

      <CreateDecisionPromptSheet open={showCreateVote} onClose={() => setShowCreateVote(false)} trip={trip} user={user} onCreated={() => { setShowCreateVote(false); setShowPanel(true); }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}