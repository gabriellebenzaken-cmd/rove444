import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Link2, BarChart2, X, Plus, Menu, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const URL_REGEX = /https?:\/\/[^\s]+/gi;

function detectUrl(text) {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

function Avatar({ name }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  const colors = ["#C8A27C", "#A0856A", "#B89060", "#D4AE8A", "#9A7055"];
  const bg = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold" style={{ background: bg }}>
      {initials}
    </div>
  );
}

const CATEGORY_COLORS = {
  cafe: "#A07850",
  restaurant: "#C87050",
  hotel: "#7090B0",
  museum: "#8060A0",
  activity: "#508060",
  bar: "#906080",
  other: "#9A8A7A",
};

function LinkCard({ msg, compact = false }) {
  return (
    <a href={msg.link_url} target="_blank" rel="noopener noreferrer" className="block no-underline">
      <div className="rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
        style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(200,162,124,0.22)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        {msg.content && msg.content !== msg.link_url && !compact && (
          <p className="px-3 pt-2.5 pb-0 text-sm" style={{ color: '#3A3028' }}>{msg.content}</p>
        )}
        <div className="px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {msg.link_title && (
                <p className="text-[13px] font-semibold leading-snug truncate" style={{ color: '#2A2018' }}>{msg.link_title}</p>
              )}
              {msg.link_summary && (
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#9A8A7A' }}>{msg.link_summary}</p>
              )}
              <p className="text-[10px] mt-1 truncate" style={{ color: '#C0B0A0' }}>{msg.link_url}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#C8A27C' }} />
          </div>
          {msg.link_category && (
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide text-white"
              style={{ background: CATEGORY_COLORS[msg.link_category] || CATEGORY_COLORS.other }}>
              {msg.link_category}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

function PollCard({ msg, user, onVote }) {
  const votes = msg.poll_votes || {};
  const totalVotes = Object.values(votes).reduce((s, arr) => s + (arr?.length || 0), 0);
  const userVoteIdx = msg.poll_options?.findIndex((_, i) => votes[i]?.includes(user?.email));

  return (
    <div className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(200,162,124,0.22)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="h-3.5 w-3.5 shrink-0" style={{ color: '#C8A27C' }} />
        <p className="text-[13px] font-semibold leading-snug" style={{ color: '#2A2018' }}>{msg.poll_question}</p>
      </div>
      <div className="space-y-1.5">
        {msg.poll_options?.map((opt, i) => {
          const count = votes[i]?.length || 0;
          const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
          const isVoted = userVoteIdx === i;
          return (
            <button key={i} onClick={() => onVote(msg, i)}
              className="w-full text-left relative rounded-xl overflow-hidden transition-all active:scale-[0.98]"
              style={{ border: `1px solid ${isVoted ? 'rgba(200,162,124,0.55)' : 'rgba(200,162,124,0.18)'}` }}>
              <div className="absolute inset-0 rounded-xl transition-all duration-500"
                style={{ width: `${pct}%`, background: isVoted ? 'rgba(200,162,124,0.2)' : 'rgba(200,162,124,0.07)' }} />
              <div className="relative flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium" style={{ color: '#3A3028' }}>{opt}</span>
                <span className="text-[10px] font-medium" style={{ color: isVoted ? '#C8A27C' : '#B0A090' }}>{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] mt-2" style={{ color: '#C0B0A0' }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
    </div>
  );
}

// Side panel showing links and polls
function HamburgerPanel({ messages, user, onVote, onClose }) {
  const [section, setSection] = useState("links");
  const links = messages.filter(m => m.message_type === "link");
  const polls = messages.filter(m => m.message_type === "poll");

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }} />
      <div className="relative w-[88%] max-w-xs h-full flex flex-col"
        style={{ background: 'rgba(250,246,241,0.97)', backdropFilter: 'blur(20px)', boxShadow: '-4px 0 32px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <h3 className="text-[15px] font-semibold" style={{ color: '#2A2018' }}>Trip Hub</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(200,162,124,0.12)' }}>
            <X className="h-4 w-4" style={{ color: '#9A8A7A' }} />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mx-5 mb-4 p-1 rounded-full" style={{ background: 'rgba(200,162,124,0.1)' }}>
          {["links", "polls"].map(s => (
            <button key={s} onClick={() => setSection(s)}
              className="flex-1 py-1.5 text-xs font-medium rounded-full capitalize transition-all"
              style={section === s ? { background: '#C8A27C', color: 'white', boxShadow: '0 1px 4px rgba(200,162,124,0.3)' } : { color: '#9A8A7A' }}>
              {s} {s === "links" ? `(${links.length})` : `(${polls.length})`}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-3">
          {section === "links" && (
            links.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Link2 className="h-8 w-8 mb-2" style={{ color: 'rgba(200,162,124,0.4)' }} />
                <p className="text-xs" style={{ color: '#B0A090' }}>No links shared yet</p>
              </div>
            ) : links.map(msg => (
              <div key={msg.id}>
                <LinkCard msg={msg} compact />
                <p className="text-[10px] mt-1 ml-1" style={{ color: '#C0B0A0' }}>
                  Shared by {msg.sender_name?.split(" ")[0] || "someone"}
                </p>
              </div>
            ))
          )}
          {section === "polls" && (
            polls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <BarChart2 className="h-8 w-8 mb-2" style={{ color: 'rgba(200,162,124,0.4)' }} />
                <p className="text-xs" style={{ color: '#B0A090' }}>No polls yet</p>
              </div>
            ) : polls.map(msg => (
              <PollCard key={msg.id} msg={msg} user={user} onVote={onVote} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function TripChat({ trip, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState("text");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [showPanel, setShowPanel] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const unsub = base44.entities.TripMessage.subscribe((event) => {
      if (event.data?.trip_id === trip.id) {
        setMessages((prev) => {
          if (event.type === "create") return [...prev, event.data];
          if (event.type === "update") return prev.map(m => m.id === event.id ? event.data : m);
          if (event.type === "delete") return prev.filter((m) => m.id !== event.id);
          return prev;
        });
      }
    });
    return unsub;
  }, [trip.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    const all = await base44.entities.TripMessage.filter({ trip_id: trip.id }, "created_date", 200);
    setMessages(all);
  }

  async function sendMessage(e) {
    e?.preventDefault();
    if (sending) return;
    setSending(true);

    if (mode === "poll") {
      const opts = pollOptions.filter(o => o.trim());
      if (!pollQuestion.trim() || opts.length < 2) { setSending(false); return; }
      await base44.entities.TripMessage.create({
        trip_id: trip.id, sender_email: user.email, sender_name: user.full_name,
        content: pollQuestion.trim(), message_type: "poll",
        poll_question: pollQuestion.trim(), poll_options: opts, poll_votes: {},
      });
      setPollQuestion(""); setPollOptions(["", ""]); setMode("text");
    } else {
      if (!text.trim()) { setSending(false); return; }
      const detectedUrl = detectUrl(text);
      if (detectedUrl) {
        // Send as link with AI summary
        let title = "", summary = "", category = "other";
        try {
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `For this URL: ${detectedUrl}
Return a JSON with:
- title: short name of the place or page (max 5 words)
- summary: one very short sentence describing what it is (max 12 words, casual travel-friendly tone)
- category: one of: cafe, restaurant, hotel, museum, activity, bar, other`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                summary: { type: "string" },
                category: { type: "string" },
              }
            }
          });
          if (res?.title) title = res.title;
          if (res?.summary) summary = res.summary;
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
    }
    setSending(false);
  }

  async function handleVote(msg, optionIndex) {
    const votes = { ...(msg.poll_votes || {}) };
    Object.keys(votes).forEach(k => { votes[k] = (votes[k] || []).filter(e => e !== user.email); });
    if (!votes[optionIndex]) votes[optionIndex] = [];
    votes[optionIndex].push(user.email);
    await base44.entities.TripMessage.update(msg.id, { poll_votes: votes });
  }

  function groupMessages() {
    const groups = [];
    let lastDate = null;
    messages.forEach((msg) => {
      const d = msg.created_date ? format(new Date(msg.created_date), "MMM d, yyyy") : null;
      if (d && d !== lastDate) { groups.push({ type: "date", label: d }); lastDate = d; }
      groups.push({ type: "msg", msg });
    });
    return groups;
  }

  return (
    <div className="flex flex-col pb-4" style={{ height: "calc(100vh - 310px)", minHeight: 360 }}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#C8A27C', letterSpacing: '0.1em' }}>
          Group Chat
        </p>
        <button
          onClick={() => setShowPanel(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'rgba(200,162,124,0.12)' }}>
          <Menu className="h-4 w-4" style={{ color: '#C8A27C' }} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-3" style={{ background: 'rgba(200,162,124,0.1)' }}>
              <Send className="h-6 w-6" style={{ color: '#C8A27C' }} />
            </div>
            <h4 className="font-semibold mb-1 text-sm" style={{ color: '#3A3028' }}>Start the conversation</h4>
            <p className="text-xs" style={{ color: '#B0A090' }}>Share messages, links, or create polls</p>
          </div>
        )}
        {groupMessages().map((item, i) => {
          if (item.type === "date") {
            return (
              <div key={i} className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(200,162,124,0.13)' }} />
                <span className="text-[10px]" style={{ color: '#C0B0A0' }}>{item.label}</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(200,162,124,0.13)' }} />
              </div>
            );
          }
          const msg = item.msg;
          const isMe = msg.sender_email === user?.email;
          const isPoll = msg.message_type === "poll";
          const isLink = msg.message_type === "link";

          if (isPoll) {
            return (
              <div key={msg.id} className="mb-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Avatar name={msg.sender_name} />
                  <span className="text-[10px]" style={{ color: '#B0A090' }}>
                    {msg.sender_name?.split(" ")[0]} · poll
                  </span>
                </div>
                <PollCard msg={msg} user={user} onVote={handleVote} />
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex gap-2 mb-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && <div className="mt-1"><Avatar name={msg.sender_name} /></div>}
              <div className={`max-w-[78%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <span className="text-[10px] ml-0.5 mb-0.5" style={{ color: '#C0B0A0' }}>
                    {msg.sender_name?.split(" ")[0] || msg.sender_email?.split("@")[0]}
                  </span>
                )}
                {isLink ? (
                  <div className="w-full">
                    <LinkCard msg={msg} />
                  </div>
                ) : (
                  <div className="px-3.5 py-2 rounded-2xl text-sm leading-relaxed"
                    style={isMe
                      ? { background: '#C8A27C', color: 'white', borderBottomRightRadius: 5 }
                      : { background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(200,162,124,0.18)', color: '#3A3028', borderBottomLeftRadius: 5 }
                    }>
                    {msg.content}
                  </div>
                )}
                {msg.created_date && (
                  <span className="text-[9px] mt-0.5 mx-0.5" style={{ color: '#C8B8A8' }}>
                    {format(new Date(msg.created_date), "h:mm a")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Poll composer */}
      {mode === "poll" && (
        <div className="rounded-2xl p-3 mb-2 mt-2" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(200,162,124,0.2)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold" style={{ color: '#3A3028' }}>New Poll</span>
            <button onClick={() => setMode("text")}><X className="h-4 w-4" style={{ color: '#9A8A7A' }} /></button>
          </div>
          <input className="w-full text-sm rounded-xl px-3 py-2 mb-2 outline-none"
            style={{ background: 'rgba(200,162,124,0.08)', color: '#3A3028' }}
            placeholder="Ask a question…" value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)} />
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-1.5 mb-1.5">
              <input className="flex-1 text-sm rounded-xl px-3 py-1.5 outline-none"
                style={{ background: 'rgba(200,162,124,0.08)', color: '#3A3028' }}
                placeholder={`Option ${i + 1}`} value={opt}
                onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }} />
              {pollOptions.length > 2 && (
                <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}>
                  <X className="h-3.5 w-3.5" style={{ color: '#B0A090' }} />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between mt-2">
            <button onClick={() => setPollOptions([...pollOptions, ""])}
              className="flex items-center gap-1 text-xs" style={{ color: '#C8A27C' }}>
              <Plus className="h-3 w-3" /> Add option
            </button>
            <button onClick={sendMessage}
              disabled={sending || !pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
              className="text-xs font-semibold px-4 py-1.5 rounded-full disabled:opacity-40"
              style={{ background: '#C8A27C', color: 'white' }}>
              Post Poll
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      {mode === "text" && (
        <form onSubmit={sendMessage} className="flex items-center gap-2 mt-2 pt-2.5" style={{ borderTop: '1px solid rgba(200,162,124,0.1)' }}>
          <button type="button" onClick={() => setMode("poll")}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(200,162,124,0.1)' }}>
            <BarChart2 className="h-3.5 w-3.5" style={{ color: '#C8A27C' }} />
          </button>
          <input value={text} onChange={e => setText(e.target.value)}
            placeholder={sending ? "Processing link…" : "Message or paste a link…"}
            autoComplete="off"
            className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(200,162,124,0.18)', color: '#3A3028' }}
          />
          <button type="submit" disabled={sending || !text.trim()}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 transition-all active:scale-90"
            style={{ background: '#C8A27C' }}>
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4 text-white" />
            )}
          </button>
        </form>
      )}

      {/* Side panel */}
      {showPanel && (
        <HamburgerPanel messages={messages} user={user} onVote={handleVote} onClose={() => setShowPanel(false)} />
      )}
    </div>
  );
}