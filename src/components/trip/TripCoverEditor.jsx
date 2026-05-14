import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, Upload, Link2 } from "lucide-react";
import { toast } from "sonner";
import TripDetailModal from "./TripDetailModal";

const presets = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
  "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&q=80",
  "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&q=80",
];

export default function TripCoverEditor({ open, onOpenChange, trip, onUpdated }) {
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);

  async function applyUrl(url) {
    await base44.entities.Trip.update(trip.id, { cover_image: url });
    toast.success("Cover photo updated!");
    onUpdated();
    onOpenChange(false);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Trip.update(trip.id, { cover_image: file_url });
    toast.success("Cover photo updated!");
    onUpdated();
    onOpenChange(false);
    setUploading(false);
  }

  return (
    <TripDetailModal open={open} onOpenChange={onOpenChange} title={<span className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Change Cover Photo</span>}>
      <div className="space-y-5">
        {/* Upload */}
        <div>
          <Label className="mb-2 block">Upload a photo</Label>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl h-14 cursor-pointer hover:bg-muted/50 transition-colors">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Choose from device</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>

        {/* URL */}
        <div>
          <Label className="mb-2 block">Or paste an image URL</Label>
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="rounded-full"
            />
            <Button
              size="sm"
              variant="outline"
              className="rounded-full shrink-0"
              onClick={() => urlInput && applyUrl(urlInput)}
              disabled={!urlInput}
            >
              <Link2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Presets */}
        <div>
          <Label className="mb-2 block">Or pick a preset</Label>
          <div className="grid grid-cols-4 gap-2">
            {presets.map((url, i) => (
              <button
                key={i}
                onClick={() => applyUrl(url)}
                className="aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </TripDetailModal>
  );
}