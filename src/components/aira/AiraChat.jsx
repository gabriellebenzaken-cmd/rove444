import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import RecommendationCard from "@/components/aira/RecommendationCard";

export default function AiraChat({ messages, input, onInputChange, onSubmit, loading, placeholder }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function renderAiraMessage(msg, i) {
    // If the message has structured results, render cards
    if (msg.results && Array.isArray(msg.results)) {
      return (
        <div key={i} className="space-y-2">
          {msg.title && (
            <p className="text-xs font-semibold text-foreground/80 px-1">{msg.title}</p>
          )}
          {msg.results.map((item, j) => (
            <RecommendationCard key={j} item={item} index={j} />
          ))}
        </div>
      );
    }
    // Fallback: plain text bubble
    return (
      <div key={i} className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed bg-card border border-border rounded-bl-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Ask anything</p>
      {messages.length > 0 && (
        <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground rounded-br-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              renderAiraMessage(msg, i)
            )
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2.5">
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder || "Ask about where you are…"}
          className="rounded-full flex-1 text-sm"
          disabled={loading}
        />
        <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}