import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { format } from "date-fns";

export default function TripChat({ trip, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const unsub = base44.entities.TripMessage.subscribe((event) => {
      if (event.data?.trip_id === trip.id) {
        setMessages((prev) => {
          if (event.type === "create") return [...prev, event.data];
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
    if (!text.trim()) return;
    setSending(true);
    await base44.entities.TripMessage.create({
      trip_id: trip.id,
      sender_email: user.email,
      sender_name: user.full_name,
      content: text.trim(),
    });
    setText("");
    setSending(false);
  }

  function groupMessages() {
    const groups = [];
    let lastDate = null;
    messages.forEach((msg) => {
      const d = msg.created_date ? format(new Date(msg.created_date), "MMM d, yyyy") : null;
      if (d && d !== lastDate) {
        groups.push({ type: "date", label: d });
        lastDate = d;
      }
      groups.push({ type: "msg", msg });
    });
    return groups;
  }

  const grouped = groupMessages();

  return (
    <div className="flex flex-col pb-6" style={{ height: "calc(100vh - 320px)", minHeight: 320 }}>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-1">Group chat</h4>
            <p className="text-xs text-muted-foreground">Be the first to send a message!</p>
          </div>
        )}
        {grouped.map((item, i) => {
          if (item.type === "date") {
            return (
              <div key={i} className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            );
          }
          const msg = item.msg;
          const isMe = msg.sender_email === user.email;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {!isMe && (
                  <span className="text-[10px] text-muted-foreground ml-1 mb-0.5">
                    {msg.sender_name || msg.sender_email?.split("@")[0]}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.created_date && (
                  <span className="text-[9px] text-muted-foreground mt-0.5 mx-1">
                    {format(new Date(msg.created_date), "h:mm a")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 mt-3 pt-3 border-t border-border">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the group..."
          className="rounded-full flex-1"
          autoComplete="off"
        />
        <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={sending || !text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}