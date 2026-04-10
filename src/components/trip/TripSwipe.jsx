import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ThumbsUp, ThumbsDown, Flame, Check } from "lucide-react";

function getItemEmoji(title = "") {
  const t = title.toLowerCase();
  if (/museum|gallery|art/.test(t)) return "🏛️";
  if (/beach|sea|ocean|surf/.test(t)) return "🏖️";
  if (/hike|trail|mountain|park/.test(t)) return "🥾";
  if (/food|eat|dinner|lunch|breakfast|restaurant|cafe|coffee/.test(t)) return "🍽️";
  if (/bar|drink|cocktail|wine/.test(t)) return "🍹";
  if (/hotel|hostel|airbnb|stay/.test(t)) return "🏨";
  if (/shop|market|store/.test(t)) return "🛍️";
  if (/concert|show|theatre|movie/.test(t)) return "🎭";
  return "📍";
}

export default function TripSwipe({ trip, user }) {
  const [activities, setActivities] = useState([]);
  const [votes, setVotes] = useState([]);
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animDir, setAnimDir] = useState(null);
  const [view, setView] = useState("swipe"); // "swipe" | "results"

  useEffect(() => {
    loadData();
  }, [trip.id]);

  async function loadData() {
    setLoading(true);
    const [items, allVotes] = await Promise.all([
      base44.entities.ItineraryItem.filter({ trip_id: trip.id }, "date", 200),
      base44.entities.ActivityVote.filter({ trip_id: trip.id }, "-created_date", 500),
    ]);
    setActivities(items || []);
    setVotes(allVotes || []);

    // Find first unvoted activity for this user
    const myVotedIds = (allVotes || [])
      .filter(v => v.user_email === user.email)
      .map(v => v.activity_id);
    const firstUnvoted = (items || []).findIndex(a => !myVotedIds.includes(a.id));
    if (firstUnvoted === -1) setDone(true);
    else setCurrent(firstUnvoted);

    setLoading(false);
  }

  async function vote(type) {
    if (current >= activities.length) return;
    const activity = activities[current];
    setAnimDir(type);

    await base44.entities.ActivityVote.create({
      trip_id: trip.id,
      activity_id: activity.id,
      activity_title: activity.title,
      user_email: user.email,
      user_name: user.full_name,
      vote_type: type,
    });

    setTimeout(() => {
      setAnimDir(null);
      const next = current + 1;
      if (next >= activities.length) setDone(true);
      else setCurrent(next);
      setVotes(prev => [...prev, { trip_id: trip.id, activity_id: activity.id, user_email: user.email, vote_type: type }]);
    }, 300);
  }

  // Compute results
  const results = activities.map(a => {
    const actVotes = votes.filter(v => v.activity_id === a.id);
    const likes = actVotes.filter(v => v.vote_type === "like").length;
    const dislikes = actVotes.filter(v => v.vote_type === "dislike").length;
    return { ...a, likes, dislikes };
  }).sort((a, b) => b.likes - a.likes);

  const topPickLikes = results[0]?.likes || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C8A27C", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="text-sm font-medium" style={{ color: "#3A3028" }}>No activities yet</p>
        <p className="text-xs mt-1" style={{ color: "#B0A090" }}>Add activities in the Schedule tab first</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Tab toggle */}
      <div className="flex gap-1 mb-5 p-1 rounded-full" style={{ background: "rgba(200,162,124,0.1)" }}>
        {[{ key: "swipe", label: "Vote" }, { key: "results", label: "Results" }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className="flex-1 py-2 text-xs font-medium rounded-full transition-all"
            style={view === key
              ? { background: "white", color: "#C8A27C", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
              : { color: "#9CA3AF" }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "swipe" ? (
        done ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(107,174,138,0.15)" }}>
              <Check className="h-7 w-7" style={{ color: "#6BAE8A" }} />
            </div>
            <p className="text-base font-semibold" style={{ color: "#2A2018" }}>All done!</p>
            <p className="text-xs mt-1 mb-4" style={{ color: "#B0A090" }}>You've voted on all activities.</p>
            <button
              onClick={() => setView("results")}
              className="px-5 py-2 rounded-full text-sm font-medium"
              style={{ background: "#C8A27C", color: "white" }}
            >
              See Results
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-center mb-4" style={{ color: "#B0A090" }}>
              {current + 1} of {activities.length} · Swipe to vote
            </p>
            {/* Card */}
            <div
              className="relative mx-auto"
              style={{
                maxWidth: 340,
                transition: "transform 0.25s ease, opacity 0.25s ease",
                transform: animDir === "like" ? "translateX(60px) rotate(8deg)" : animDir === "dislike" ? "translateX(-60px) rotate(-8deg)" : "none",
                opacity: animDir ? 0 : 1,
              }}
            >
              <div className="rounded-3xl p-6 flex flex-col items-center text-center" style={{ background: "white", border: "1px solid rgba(200,162,124,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", minHeight: 200 }}>
                <div className="text-5xl mb-3">{getItemEmoji(activities[current]?.title)}</div>
                <h3 className="text-base font-semibold mb-1" style={{ color: "#2A2018" }}>{activities[current]?.title}</h3>
                {activities[current]?.location && (
                  <p className="text-xs mb-1" style={{ color: "#9A8A7A" }}>📍 {activities[current]?.location}</p>
                )}
                {activities[current]?.date && (
                  <p className="text-xs" style={{ color: "#C8A27C" }}>{activities[current]?.date}</p>
                )}
              </div>
            </div>

            {/* Vote buttons */}
            <div className="flex items-center justify-center gap-8 mt-6">
              <button
                onClick={() => vote("dislike")}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-90"
                style={{ background: "rgba(220,80,80,0.08)", border: "2px solid rgba(220,80,80,0.2)" }}
              >
                <ThumbsDown className="h-6 w-6" style={{ color: "#D05050" }} />
              </button>
              <button
                onClick={() => vote("like")}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-90"
                style={{ background: "rgba(107,174,138,0.1)", border: "2px solid rgba(107,174,138,0.25)" }}
              >
                <ThumbsUp className="h-6 w-6" style={{ color: "#6BAE8A" }} />
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {results.map((a, i) => {
            const isTop = a.likes === topPickLikes && topPickLikes > 0;
            const total = a.likes + a.dislikes;
            const pct = total > 0 ? Math.round((a.likes / total) * 100) : 0;
            return (
              <div key={a.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.9)", border: `1px solid ${isTop ? "rgba(200,162,124,0.4)" : "rgba(200,162,124,0.15)"}` }}>
                <span className="text-2xl">{getItemEmoji(a.title)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate" style={{ color: "#2A2018" }}>{a.title}</p>
                    {isTop && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0" style={{ background: "rgba(255,163,50,0.15)", color: "#C87830" }}>
                        <Flame className="h-2.5 w-2.5" /> Top Pick
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(200,162,124,0.12)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#6BAE8A", transition: "width 0.4s" }} />
                    </div>
                    <span className="text-[10px] shrink-0" style={{ color: "#9A8A7A" }}>
                      👍 {a.likes} · 👎 {a.dislikes}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}