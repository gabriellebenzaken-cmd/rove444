import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import SwipeDecisionViewer from "./SwipeDecisionViewer";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function DecisionPromptCard({ prompt }) {
  const [showViewer, setShowViewer] = useState(false);
  const [voteCount, setVoteCount] = useState(0);

  async function loadVoteCount() {
    const votes = await base44.entities.DecisionVote.filter({ prompt_id: prompt.id }, "-created_date", 200);
    const unique = new Set(votes.map((v) => `${v.user_email}:${v.option_id}`));
    setVoteCount(unique.size);
  }

  async function handleOpen() {
    await loadVoteCount();
    setShowViewer(true);
  }

  const categoryLabel = {
    lodging: "🏨",
    restaurant: "🍽️",
    activity: "🎯",
    transport: "🚕",
    general: "❓",
  }[prompt.category] || "❓";

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full rounded-2xl p-4 text-left transition-all hover:shadow-sm"
        style={{ background: "rgba(200,162,124,0.08)", border: "1px solid rgba(200,162,124,0.15)" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium" style={{ color: "#B0A090" }}>
              {categoryLabel} {prompt.created_by_name} started a vote
            </p>
            <p className="text-sm font-semibold mt-1 mb-2" style={{ color: "#2A2018" }}>
              {prompt.title}
            </p>
            <p className="text-xs" style={{ color: "#9A8A7A" }}>
              {voteCount} votes cast
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 mt-1" style={{ color: "#C8A27C" }} />
        </div>
      </button>

      <Dialog open={showViewer} onOpenChange={setShowViewer}>
        <DialogContent className="max-w-sm">
          <div className="py-4">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "#2A2018" }}>
              {prompt.title}
            </h2>
            <p className="text-xs mb-4" style={{ color: "#B0A090" }}>
              by {prompt.created_by_name}
            </p>
            <SwipeDecisionViewer prompt={prompt} onClose={() => setShowViewer(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}