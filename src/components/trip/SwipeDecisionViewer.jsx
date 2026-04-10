import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function SwipeDecisionViewer({ prompt, onClose }) {
  const [options, setOptions] = useState([]);
  const [votes, setVotes] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userVotes, setUserVotes] = useState({});
  const [view, setView] = useState("swipe");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    base44.auth.me().then(setUser);
  }, [prompt.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [allOptions, allVotes] = await Promise.all([
        base44.entities.DecisionOption.filter({ prompt_id: prompt.id }, "-created_date", 200),
        base44.entities.DecisionVote.filter({ prompt_id: prompt.id }, "-created_date", 200),
      ]);
      setOptions(allOptions);
      setVotes(allVotes);

      const myVotes = {};
      allVotes.forEach((v) => {
        if (v.user_email === user?.email) myVotes[v.option_id] = v.vote_type;
      });
      setUserVotes(myVotes);
    } catch (err) {
      toast.error("Failed to load options");
    } finally {
      setLoading(false);
    }
  }

  async function submitVote(voteType) {
    if (!user || !options[currentIdx]) return;

    const optionId = options[currentIdx].id;
    if (userVotes[optionId]) {
      toast.info("You already voted on this option");
      return;
    }

    try {
      await base44.entities.DecisionVote.create({
        prompt_id: prompt.id,
        option_id: optionId,
        user_email: user.email,
        user_name: user.full_name,
        vote_type: voteType,
      });

      setUserVotes({ ...userVotes, [optionId]: voteType });
      if (currentIdx < options.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        toast.success("You've voted on all options!");
        setTimeout(() => setView("results"), 500);
      }
    } catch (err) {
      toast.error("Failed to save vote");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#C8A27C" }} />
      </div>
    );
  }

  if (view === "results") {
    return <ResultsView options={options} votes={votes} onBack={() => setView("swipe")} onClose={onClose} />;
  }

  if (options.length === 0) {
    return <p className="text-xs text-center py-4 text-muted-foreground">No options available</p>;
  }

  const current = options[currentIdx];
  const currentVote = userVotes[current.id];

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="flex items-center justify-between text-[10px]" style={{ color: "#B0A090" }}>
        <span>Option {currentIdx + 1} of {options.length}</span>
        <button
          onClick={() => setView("results")}
          className="font-medium"
          style={{ color: "#C8A27C" }}
        >
          See results →
        </button>
      </div>

      {/* Swipe card */}
      <div
        className="rounded-2xl p-4 text-center min-h-32 flex flex-col items-center justify-center transition-all"
        style={{ background: "linear-gradient(135deg, rgba(200,162,124,0.1), rgba(200,162,124,0.05))", border: "1px solid rgba(200,162,124,0.2)" }}
      >
        <p className="text-base font-semibold mb-2" style={{ color: "#2A2018" }}>
          {current.title}
        </p>
        {current.description && (
          <p className="text-xs" style={{ color: "#9A8A7A" }}>
            {current.description}
          </p>
        )}
      </div>

      {/* Vote buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => submitVote("not_it")}
          variant="outline"
          className="flex-1 rounded-full h-10"
          disabled={currentVote !== undefined}
        >
          🥱 not it
        </Button>
        <Button
          onClick={() => submitVote("vibe")}
          className="flex-1 rounded-full h-10"
          style={{
            background: "#C8A27C",
            color: "white",
            opacity: currentVote !== undefined ? 0.5 : 1,
          }}
          disabled={currentVote !== undefined}
        >
          ✨ vibe
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCurrentIdx(0);
            setUserVotes({});
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentIdx(Math.min(options.length - 1, currentIdx + 1))}
          disabled={currentIdx === options.length - 1}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ResultsView({ options, votes, onBack, onClose }) {
  const voteCounts = {};
  options.forEach((opt) => {
    voteCounts[opt.id] = {
      vibe: 0,
      not_it: 0,
    };
  });

  votes.forEach((v) => {
    if (voteCounts[v.option_id]) {
      voteCounts[v.option_id][v.vote_type]++;
    }
  });

  const topOption = options.reduce((top, opt) => {
    const topCount = voteCounts[top.id]?.vibe || 0;
    const optCount = voteCounts[opt.id]?.vibe || 0;
    return optCount > topCount ? opt : top;
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: "#2A2018" }}>Results</h3>
      <div className="space-y-2">
        {options.map((opt) => {
          const counts = voteCounts[opt.id] || { vibe: 0, not_it: 0 };
          const isTop = opt.id === topOption.id;
          return (
            <div
              key={opt.id}
              className="rounded-xl p-3"
              style={{
                background: isTop ? "rgba(200,162,124,0.12)" : "rgba(255,255,255,0.6)",
                border: isTop ? "1px solid rgba(200,162,124,0.3)" : "1px solid rgba(200,162,124,0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium" style={{ color: "#2A2018" }}>
                  {opt.title}
                  {isTop && <span className="ml-2">✨ top vibe</span>}
                </p>
              </div>
              <div className="flex gap-3 text-xs">
                <span style={{ color: "#4A8E6A" }}>✨ {counts.vibe}</span>
                <span style={{ color: "#B0A090" }}>🥱 {counts.not_it}</span>
              </div>
            </div>
          );
        })}
      </div>
      <Button
        variant="outline"
        className="w-full rounded-full"
        onClick={onBack}
      >
        Back to voting
      </Button>
      <Button
        className="w-full rounded-full"
        style={{ background: "#C8A27C", color: "white" }}
        onClick={onClose}
      >
        Done
      </Button>
    </div>
  );
}