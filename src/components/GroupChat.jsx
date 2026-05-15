import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, MessageCircle, BarChart2, X, Plus } from "lucide-react";

function UserAvatar({ name, photo }) {
  if (photo) {
    return <img src={photo} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(200,162,124,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#C8A27C", flexShrink: 0 }}>
      {name?.[0] || "?"}
    </div>
  );
}

export default function GroupChat({ group, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("text");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [profileMap, setProfileMap] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.entities.UserProfile.list("-created_date", 300).then(profiles => {
      const map = {};
      profiles.forEach(p => { if (p.user_email) map[p.user_email] = p; });
      setProfileMap(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!group?.id) return;
    setLoading(true);
    base44.entities.TripMessage.filter({ trip_id: group.id }, "created_date", 200)
      .then((msgs) => { setMessages(msgs || []); setLoading(false); })
      .catch(() => setLoading(false));

    const unsub = base44.entities.TripMessage.subscribe((event) => {
      if (event.data?.trip_id === group.id) {
        setMessages(prev => {
          if (event.type === "create") {
            // Deduplicate: don't add if already present (optimistic append)
            if (prev.some(m => m.id === event.data.id)) return prev;
            return [...prev, event.data];
          }
          if (event.type === "update") return prev.map(m => m.id === event.id ? event.data : m);
          if (event.type === "delete") return prev.filter(m => m.id !== event.id);
          return prev;
        });
      }
    });
    return () => unsub?.();
  }, [group?.id]);

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
      try {
        const created = await base44.entities.TripMessage.create({
          trip_id: group.id, sender_email: user.email, sender_name: user.full_name,
          content: pollQuestion.trim(), message_type: "poll",
          poll_question: pollQuestion.trim(), poll_options: opts, poll_votes: {},
        });
        if (created) setMessages(prev => [...prev, created]);
        setPollQuestion(""); setPollOptions(["", ""]); setMode("text");
      } catch (err) {
        console.error("[GroupChat] Failed to send poll:", err);
      } finally {
        setSending(false);
      }
      return;
    }

    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    setSending(true);
    try {
      const created = await base44.entities.TripMessage.create({
        trip_id: group.id, sender_email: user.email, sender_name: user.full_name,
        content, message_type: "text",
      });
      if (created) setMessages(prev => [...prev, created]);
    } catch (err) {
      console.error("[GroupChat] Failed to send message:", err);
      setText(content);
    } finally {
      setSending(false);
    }
  }

  async function handleVote(msg, optionIndex) {
    const votes = {};
    // Deep copy vote arrays
    Object.keys(msg.poll_votes || {}).forEach(k => { votes[k] = [...(msg.poll_votes[k] || [])]; });
    // Remove user's previous vote from all options
    Object.keys(votes).forEach(k => { votes[k] = votes[k].filter(e => e !== user.email); });
    // Toggle: if clicking the already-voted option, just remove vote; else add
    const alreadyVoted = String(Object.keys(msg.poll_votes || {}).find(k => (msg.poll_votes[k] || []).includes(user.email))) === String(optionIndex);
    if (!alreadyVoted) {
      if (!votes[optionIndex]) votes[optionIndex] = [];
      votes[optionIndex].push(user.email);
    }
    // Optimistic update
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, poll_votes: votes } : m));
    await base44.entities.TripMessage.update(msg.id, { poll_votes: votes });
  }

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
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 320px)", minHeight: 400 }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }}>
        {messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", paddingBottom: 40 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(200,162,124,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <MessageCircle size={24} color="#C8A27C" />
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: "#3A3028" }}>Start the conversation</p>
            <p style={{ margin: 0, fontSize: 12, color: "#B0A090" }}>Send messages and polls to your group.</p>
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

              if (isPoll) {
                const opts = msg.poll_options || [];
                const votes = msg.poll_votes || {};
                const totalVotes = Object.values(votes).flat().length;
                const myVote = Object.keys(votes).find(k => votes[k]?.includes(user.email));
                return (
                  <div key={msg.id} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <UserAvatar name={msg.sender_name} photo={profileMap[msg.sender_email]?.profile_photo} />
                      <span style={{ fontSize: 10, color: "#B0A090" }}>{msg.sender_name?.split(" ")[0]} · poll</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.88)", border: "1px solid rgba(200,162,124,0.2)", borderRadius: 16, padding: 14 }}>
                      <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#2A2018" }}>{msg.poll_question}</p>
                      {opts.map((opt, idx) => {
                        const count = votes[idx]?.length || 0;
                        const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                        const voted = String(myVote) === String(idx);
                        return (
                          <button key={idx} onClick={() => handleVote(msg, idx)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", marginBottom: 6, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                            <div style={{ flex: 1, borderRadius: 8, overflow: "hidden", position: "relative", height: 32, background: "rgba(200,162,124,0.08)" }}>
                              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: voted ? "rgba(200,162,124,0.4)" : "rgba(200,162,124,0.18)", transition: "width 0.3s" }} />
                              <span style={{ position: "relative", zIndex: 1, fontSize: 12, fontWeight: voted ? 600 : 400, color: "#3A3028", padding: "0 10px", lineHeight: "32px" }}>{opt}</span>
                            </div>
                            <span style={{ fontSize: 11, color: "#B0A090", width: 28, textAlign: "right", flexShrink: 0 }}>{pct}%</span>
                          </button>
                        );
                      })}
                      <p style={{ margin: "6px 0 0", fontSize: 10, color: "#C0B0A0" }}>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} style={{ display: "flex", gap: 6, justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 2 }}>
                  {!isMe && <div style={{ marginTop: 4 }}><UserAvatar name={msg.sender_name} photo={profileMap[msg.sender_email]?.profile_photo} /></div>}
                  <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    {!isMe && (
                      <span style={{ fontSize: 10, color: "#C0B0A0", marginBottom: 3, marginLeft: 2 }}>
                        {msg.sender_name?.split(" ")[0] || msg.sender_email?.split("@")[0]}
                      </span>
                    )}
                    <div style={{
                      padding: "8px 14px", borderRadius: 18, fontSize: 13, lineHeight: 1.5,
                      ...(isMe
                        ? { background: "#C8A27C", color: "white", borderBottomRightRadius: 5 }
                        : { background: "rgba(255,255,255,0.82)", border: "1px solid rgba(200,162,124,0.18)", color: "#3A3028", borderBottomLeftRadius: 5 })
                    }}>
                      {msg.content}
                    </div>
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
            placeholder="Send a message…"
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
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}