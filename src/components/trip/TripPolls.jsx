import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle2, BarChart3, Lock, X } from "lucide-react";

export default function TripPolls({ trip, user }) {
  const [polls, setPolls] = useState([]);
  const [votes, setVotes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();

    const unsubPolls = base44.entities.TripPoll.subscribe((event) => {
      if (event.data?.trip_id === trip.id || event.type === "delete") {
        loadData();
      }
    });
    const unsubVotes = base44.entities.TripPollVote.subscribe((event) => {
      if (event.data?.trip_id === trip.id) {
        loadData();
      }
    });
    return () => { unsubPolls(); unsubVotes(); };
  }, [trip.id]);

  async function loadData() {
    const [p, v] = await Promise.all([
      base44.entities.TripPoll.filter({ trip_id: trip.id }, "-created_date", 50),
      base44.entities.TripPollVote.filter({ trip_id: trip.id }, "created_date", 500),
    ]);
    setPolls(p);
    setVotes(v);
  }

  async function createPoll(e) {
    e.preventDefault();
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    setSaving(true);
    await base44.entities.TripPoll.create({
      trip_id: trip.id,
      question: question.trim(),
      options: validOptions,
      created_by_email: user.email,
      created_by_name: user.full_name,
      is_closed: false,
    });
    setQuestion("");
    setOptions(["", ""]);
    setShowCreate(false);
    setSaving(false);
    loadData();
  }

  async function castVote(pollId, optionIndex) {
    const existing = votes.find((v) => v.poll_id === pollId && v.voter_email === user.email);
    if (existing) {
      if (existing.option_index === optionIndex) return;
      await base44.entities.TripPollVote.delete(existing.id);
    }
    await base44.entities.TripPollVote.create({
      poll_id: pollId,
      trip_id: trip.id,
      voter_email: user.email,
      voter_name: user.full_name,
      option_index: optionIndex,
    });
    loadData();
  }

  async function deletePoll(pollId) {
    await base44.entities.TripPoll.delete(pollId);
    const pollVotes = votes.filter((v) => v.poll_id === pollId);
    await Promise.all(pollVotes.map((v) => base44.entities.TripPollVote.delete(v.id)));
    loadData();
  }

  async function closePoll(pollId) {
    await base44.entities.TripPoll.update(pollId, { is_closed: true });
    loadData();
  }

  function getResults(poll) {
    const pollVotes = votes.filter((v) => v.poll_id === poll.id);
    const total = pollVotes.length;
    return poll.options.map((opt, i) => {
      const count = pollVotes.filter((v) => v.option_index === i).length;
      return { label: opt, count, pct: total ? Math.round((count / total) * 100) : 0 };
    });
  }

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Polls</h3>
          <span className="text-xs text-muted-foreground">({polls.length})</span>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Create Poll
        </Button>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-semibold mb-1">No polls yet</h4>
          <p className="text-xs text-muted-foreground">Vote on restaurants, activities, dates and more!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const results = getResults(poll);
            const myVote = votes.find((v) => v.poll_id === poll.id && v.voter_email === user.email);
            const totalVotes = results.reduce((s, r) => s + r.count, 0);
            const isOwner = poll.created_by_email === user.email;
            const hasVoted = !!myVote;

            return (
              <div key={poll.id} className="bg-card rounded-2xl border border-border p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {poll.is_closed && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" /> Closed
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-snug">{poll.question}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      by {poll.created_by_name || poll.created_by_email?.split("@")[0]} · {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {isOwner && (
                    <div className="flex gap-1 shrink-0">
                      {!poll.is_closed && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => closePoll(poll.id)}>
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deletePoll(poll.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {results.map((result, i) => {
                    const isSelected = myVote?.option_index === i;
                    const showBar = hasVoted || poll.is_closed;
                    return (
                      <button
                        key={i}
                        disabled={poll.is_closed}
                        onClick={() => !poll.is_closed && castVote(poll.id, i)}
                        className={`w-full text-left rounded-xl border transition-all overflow-hidden ${
                          isSelected
                            ? "border-primary bg-accent"
                            : "border-border bg-background hover:bg-muted/50"
                        } ${poll.is_closed ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <div className="relative px-3 py-2.5">
                          {showBar && result.pct > 0 && (
                            <div
                              className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-500 ${
                                isSelected ? "bg-primary/15" : "bg-muted"
                              }`}
                              style={{ width: `${result.pct}%` }}
                            />
                          )}
                          <div className="relative flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                              <span className={`text-sm ${isSelected ? "font-semibold text-primary" : ""}`}>
                                {result.label}
                              </span>
                            </div>
                            {showBar && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {result.count} ({result.pct}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!hasVoted && !poll.is_closed && (
                  <p className="text-[10px] text-muted-foreground mt-2">Tap an option to vote</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Poll Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="mx-4 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Poll</DialogTitle>
          </DialogHeader>
          <form onSubmit={createPoll} className="space-y-4">
            <div>
              <Label className="mb-1 block">Question</Label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Which restaurant should we try?"
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="mb-1 block">Options</Label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const next = [...options];
                        next[i] = e.target.value;
                        setOptions(next);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="rounded-xl flex-1"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary"
                  onClick={() => setOptions([...options, ""])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add option
                </Button>
              )}
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={saving}>
              {saving ? "Creating..." : "Create Poll"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}