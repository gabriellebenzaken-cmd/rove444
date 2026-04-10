import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import BottomSheet from "../BottomSheet";
import { toast } from "sonner";



export default function CreateDecisionPromptSheet({ open, onClose, trip, user, onCreated }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [options, setOptions] = useState([]);
  const [optionInput, setOptionInput] = useState("");
  const [loading, setLoading] = useState(false);

  function addOption() {
    if (optionInput.trim()) {
      setOptions([...options, { title: optionInput }]);
      setOptionInput("");
    }
  }

  function removeOption(idx) {
    setOptions(options.filter((_, i) => i !== idx));
  }

  async function createPrompt(e) {
    e.preventDefault();
    if (!title.trim() || options.length < 2) {
      toast.error("Add a title and at least 2 options");
      return;
    }

    setLoading(true);
    try {
      const prompt = await base44.entities.DecisionPrompt.create({
        trip_id: trip.id,
        created_by_email: user.email,
        created_by_name: user.full_name,
        title,
        category,
      });

      for (const opt of options) {
        await base44.entities.DecisionOption.create({
          prompt_id: prompt.id,
          title: opt.title,
        });
      }

      toast.success("Vote started!");
      setTitle("");
      setCategory("");
      setOptions([]);
      setOptionInput("");
      onClose();
      onCreated?.(prompt);
    } catch (err) {
      toast.error("Failed to create vote");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Start a Vote">
      <form onSubmit={createPrompt} className="space-y-3">
        <div>
          <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>
            What do you want to decide?
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Which hotel should we book?"
            className="h-9 text-sm"
            style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
          />
        </div>

        <div>
          <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>
            Category (optional)
          </Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., hotel, museum, beach, food"
            className="h-9 text-sm"
            style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
          />
        </div>

        <div>
          <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>
            Add Options
          </Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
              placeholder="Option name"
              className="h-9 text-sm flex-1"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
            />
            <Button
              type="button"
              onClick={addOption}
              size="icon"
              className="h-9 w-9 rounded-lg"
              style={{ background: "#C8A27C", color: "white" }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {options.length > 0 && (
            <div className="space-y-1.5">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ background: "rgba(200,162,124,0.08)" }}
                >
                  <span className="text-xs" style={{ color: "#3A3028" }}>{opt.title}</span>
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] mt-2" style={{ color: "#B0A090" }}>
            {options.length} option{options.length !== 1 ? "s" : ""} added
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-full text-sm font-semibold"
          style={{ background: "#C8A27C", color: "white", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Creating..." : "Start Vote"}
        </button>
      </form>
    </BottomSheet>
  );
}