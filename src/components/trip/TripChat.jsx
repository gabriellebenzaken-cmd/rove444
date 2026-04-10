import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Link2, BarChart2, X, Plus } from "lucide-react";
import { format } from "date-fns";

function Avatar({ name, size = 7 }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  const colors = ["#C8A27C", "#A0856A", "#B89060", "#D4AE8A", "#9A7055"];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center shrink-0 text-white font-semibold`}
      style={{ background: color, fontSize: size * 2.2, width: size * 4, height: size * 4 }}
    >
      <span style={{ fontSize: size * 1.6 }}>{initials}</span>
    </div>
  );
}

function LinkBubble({ msg, isMe }) {
  return (
    <a href={msg.link_url} target="_blank" rel="noopener noreferrer" className="block no-underline">
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(200,162,124,0.25)', background: isMe ? 'rgba(200,162,124,0.85)' : 'rgba(255,255,255,0.85)' }}>
        {msg.content && msg.content !== msg.link_url && (
          <p className="px-3 pt-2.5 text-sm" style={{ color: isMe ? 'white' : '#3A3028' }}>{msg.content}</p>
        )}
        <div className="px-3 py-2 flex items-center gap-2 border-t" style={{ borderColor: 'rgba(200,162,124,0.15)', background: isMe ? 'rgba(0,0,0,0.1)' : 'rgba(200,162,124,0.07)' }}>
          <Link2 className="h-3 w-3 shrink-0" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : '#C8A27C' }} />
          <div className="min-w-0">
            {msg.link_title && <p className="text-xs font-medium truncate" style={{ color: isMe ? 'white' : '#3A3028' }}>{msg.link_title}</p>}
            <p className="text-[10px] truncate" style={{ color: isMe ? 'rgba(255,255,255,0.6)' : '#9A8A7A' }}>{msg.link_url}</p>
          </div>
        </div>
      </div>
    </a>
  );
}

function PollBubble({ msg, user, onVote }) {
  const votes = msg.poll_votes || {};
  const totalVotes = Object.values(votes).reduce((s, arr) => s + (arr?.length || 0), 0);
  const userVote = msg.poll_options?.findIndex((_, i) => votes[i]?.includes(user?.email));

  return (
    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(200,162,124,0.25)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart2 className="h-3.5 w-3.5" style={{ color: '#C8A27C' }} />
        <p className="text-xs font-semibold" style={{ color: '#3A3028' }}>{msg.poll_question}</p>
      </div>
      <div className="space-y-1.5">
        {msg.poll_options?.map((opt, i) => {
          const count = votes[i]?.length || 0;
          const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
          const isVoted = userVote === i;
          return (
            <button
              key={i}
              onClick={() => onVote(msg, i)}
              className="w-full text-left relative rounded-xl overflow-hidden transition-all active:scale-[0.98]"
              style={{ border: `1px solid ${isVoted ? 'rgba(200,162,124,0.6)' : 'rgba(200,162,124,0.2)'}` }}
            >
              <div
                className="absolute inset-0 rounded-xl transition-all duration-500"
                style={{ width: `${pct}%`, background: isVoted ? 'rgba(200,162,124,0.22)' : 'rgba(200,162,124,0.08)' }}
              />
              <div className="relative flex items-center justify-between px-2.5 py-2">
                <span className="text-xs font-medium" style={{ color: '#3A3028' }}>{opt}</span>
                <span className="text-[10px]" style={{ color: '#9A8A7A' }}>{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] mt-2" style={{ color: '#B0A090' }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function TripChat({ trip, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState("text"); // "text" | "link" | "poll"
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [linkUrl, setLinkUrl] = useState("");
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
    e.preventDefault();
    setSending(true);

    if (mode === "poll") {
      const opts = pollOptions.filter(o => o.trim());
      if (!pollQuestion.trim() || opts.length < 2) { setSending(false); return; }
      await base44.entities.TripMessage.create({
        trip_id: trip.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content: pollQuestion.trim(),
        message_type: "poll",
        poll_question: pollQuestion.trim(),
        poll_options: opts,
        poll_votes: {},
      });
      setPollQuestion(""); setPollOptions(["", ""]); setMode("text");
    } else if (mode === "link") {
      if (!linkUrl.trim()) { setSending(false); return; }
      let title = "";
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `What is the title or name of this URL: ${linkUrl}? Reply with just the title, no explanation.`,
          add_context_from_internet: true,
        });
        title = typeof res === "string" ? res.trim() : "";
      } catch {}
      await base44.entities.TripMessage.create({
        trip_id: trip.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content: text.trim() || linkUrl,
        message_type: "link",
        link_url: linkUrl.trim(),
        link_title: title,
      });
      setLinkUrl(""); setText(""); setMode("text");
    } else {
      if (!text.trim()) { setSending(false); return; }
      await base44.entities.TripMessage.create({
        trip_id: trip.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content: text.trim(),
        message_type: "text",
      });
      setText("");
    }
    setSending(false);
  }

  async function handleVote(msg, optionIndex) {
    const votes = { ...(msg.poll_votes || {}) };
    // Remove previous vote by this user
    Object.keys(votes).forEach(k => {
      votes[k] = (votes[k] || []).filter(e => e !== user.email);
    });
    // Add new vote
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

  const grouped = groupMessages();

  return (
    <div className="flex flex-col pb-6" style={{ height: "calc(100vh - 320px)", minHeight: 360 }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-3" style={{ background: 'rgba(200,162,124,0.12)' }}>
              <Send className="h-6 w-6" style={{ color: '#C8A27C' }} />
            </div>
            <h4 className="font-semibold mb-1 text-sm" style={{ color: '#3A3028' }}>Group hub</h4>
            <p className="text-xs" style={{ color: '#9A8A7A' }}>Chat, share links, and create polls</p>
          </div>
        )}
        {grouped.map((item, i) => {
          if (item.type === "date") {
            return (
              <div key={i} className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(200,162,124,0.15)' }} />
                <span className="text-[10px]" style={{ color: '#B0A090' }}>{item.label}</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(200,162,124,0.15)' }} />
              </div>
            );
          }
          const msg = item.msg;
          const isMe = msg.sender_email === user?.email;
          const isPoll = msg.message_type === "poll";
          const isLink = msg.message_type === "link";

          return (
            <div key={msg.id} className={`flex gap-2 mb-2 ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && !isPoll && (
                <div className="mt-1">
                  <Avatar name={msg.sender_name || msg.sender_email} size={7} />
                </div>
              )}
              <div className={`${isPoll ? "w-full max-w-[85%]" : "max-w-[75%]"} flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <span className="text-[10px] ml-1 mb-0.5" style={{ color: '#B0A090' }}>
                    {msg.sender_name || msg.sender_email?.split("@")[0]}
                  </span>
                )}
                {isPoll ? (
                  <PollBubble msg={msg} user={user} onVote={handleVote} />
                ) : isLink ? (
                  <LinkBubble msg={msg} isMe={isMe} />
                ) : (
                  <div
                    className="px-3.5 py-2 rounded-2xl text-sm leading-relaxed"
                    style={isMe
                      ? { background: '#C8A27C', color: 'white', borderBottomRightRadius: 6 }
                      : { background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(200,162,124,0.18)', color: '#3A3028', borderBottomLeftRadius: 6 }
                    }
                  >
                    {msg.content}
                  </div>
                )}
                {msg.created_date && (
                  <span className="text-[9px] mt-0.5 mx-1" style={{ color: '#C0B0A0' }}>
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
        <div className="rounded-2xl p-3 mb-2" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(200,162,124,0.2)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: '#3A3028' }}>New Poll</span>
            <button onClick={() => setMode("text")}><X className="h-4 w-4" style={{ color: '#9A8A7A' }} /></button>
          </div>
          <input
            className="w-full text-sm rounded-xl px-3 py-2 mb-2 outline-none"
            style={{ background: 'rgba(200,162,124,0.08)', color: '#3A3028' }}
            placeholder="Ask a question…"
            value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)}
          />
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-1.5 mb-1.5">
              <input
                className="flex-1 text-sm rounded-xl px-3 py-1.5 outline-none"
                style={{ background: 'rgba(200,162,124,0.08)', color: '#3A3028' }}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }}
              />
              {pollOptions.length > 2 && (
                <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}>
                  <X className="h-3.5 w-3.5" style={{ color: '#B0A090' }} />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setPollOptions([...pollOptions, ""])}
              className="flex items-center gap-1 text-xs"
              style={{ color: '#C8A27C' }}
            >
              <Plus className="h-3 w-3" /> Add option
            </button>
            <button
              onClick={sendMessage}
              disabled={sending || !pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
              className="text-xs font-semibold px-4 py-1.5 rounded-full disabled:opacity-40"
              style={{ background: '#C8A27C', color: 'white' }}
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Link composer */}
      {mode === "link" && (
        <div className="rounded-2xl p-3 mb-2" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(200,162,124,0.2)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: '#3A3028' }}>Share Link</span>
            <button onClick={() => setMode("text")}><X className="h-4 w-4" style={{ color: '#9A8A7A' }} /></button>
          </div>
          <input
            className="w-full text-sm rounded-xl px-3 py-2 mb-1.5 outline-none"
            style={{ background: 'rgba(200,162,124,0.08)', color: '#3A3028' }}
            placeholder="https://..."
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
          />
          <input
            className="w-full text-sm rounded-xl px-3 py-2 mb-2 outline-none"
            style={{ background: 'rgba(200,162,124,0.08)', color: '#3A3028' }}
            placeholder="Add a note (optional)"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={sendMessage}
              disabled={sending || !linkUrl.trim()}
              className="text-xs font-semibold px-4 py-1.5 rounded-full disabled:opacity-40"
              style={{ background: '#C8A27C', color: 'white' }}
            >
              {sending ? "Sharing…" : "Share"}
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      {mode === "text" && (
        <form onSubmit={sendMessage} className="flex items-center gap-2 mt-2 pt-2.5" style={{ borderTop: '1px solid rgba(200,162,124,0.12)' }}>
          <button type="button" onClick={() => setMode("link")} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90" style={{ background: 'rgba(200,162,124,0.12)' }}>
            <Link2 className="h-3.5 w-3.5" style={{ color: '#C8A27C' }} />
          </button>
          <button type="button" onClick={() => setMode("poll")} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90" style={{ background: 'rgba(200,162,124,0.12)' }}>
            <BarChart2 className="h-3.5 w-3.5" style={{ color: '#C8A27C' }} />
          </button>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Message the group…"
            autoComplete="off"
            className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(200,162,124,0.2)', color: '#3A3028' }}
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 transition-all active:scale-90"
            style={{ background: '#C8A27C' }}
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </form>
      )}
    </div>
  );
}