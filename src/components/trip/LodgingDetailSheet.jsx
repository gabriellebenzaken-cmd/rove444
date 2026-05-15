import { format } from "date-fns";
import { MapPin, ExternalLink, Moon, Edit2, Trash2, Users, FileText } from "lucide-react";
import BottomSheet from "../BottomSheet";

export default function LodgingDetailSheet({ lodging, open, onClose, onEdit, onDelete }) {
  if (!lodging) return null;

  const nights = lodging.check_in && lodging.check_out
    ? Math.round((new Date(lodging.check_out) - new Date(lodging.check_in)) / 86400000)
    : null;
  const checkIn  = lodging.check_in  ? format(new Date(lodging.check_in  + "T00:00:00"), "EEE, MMM d") : null;
  const checkOut = lodging.check_out ? format(new Date(lodging.check_out + "T00:00:00"), "EEE, MMM d") : null;

  return (
    <BottomSheet open={open} onClose={onClose} title={lodging.name}>
      <div className="space-y-4 pb-2">

        {/* Hero image */}
        {lodging.image_url && (
          <div className="w-full h-44 rounded-2xl overflow-hidden bg-muted -mt-1">
            <img src={lodging.image_url} alt={lodging.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Address */}
        {lodging.address && (
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-snug">{lodging.address}</p>
          </div>
        )}

        {/* Check-in / check-out strip */}
        {(checkIn || checkOut) && (
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(200,162,124,0.08)", border: "1px solid rgba(200,162,124,0.18)" }}>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Check-in</p>
              <p className="text-sm font-semibold text-foreground">{checkIn || "—"}</p>
            </div>
            {nights > 0 && (
              <div className="flex flex-col items-center gap-0.5 px-1">
                <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">{nights}n</span>
              </div>
            )}
            <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(200,162,124,0.08)", border: "1px solid rgba(200,162,124,0.18)" }}>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Check-out</p>
              <p className="text-sm font-semibold text-foreground">{checkOut || "—"}</p>
            </div>
            {lodging.price_per_night && (
              <div className="flex flex-col items-end shrink-0 pl-1">
                <p className="text-sm font-semibold text-foreground">${lodging.price_per_night}</p>
                <p className="text-[9px] text-muted-foreground">/night</p>
              </div>
            )}
          </div>
        )}

        {/* Guests */}
        {lodging.guest_emails?.length > 0 && (
          <div className="flex items-start gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-snug">
              {lodging.guest_emails.join(", ")}
            </p>
          </div>
        )}

        {/* Notes */}
        {lodging.notes && (
          <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(200,162,124,0.06)", border: "1px solid rgba(200,162,124,0.14)" }}>
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">{lodging.notes}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {lodging.booking_url && (
            <button
              type="button"
              onClick={() => window.open(lodging.booking_url, "_blank")}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-full text-sm font-medium border"
              style={{ borderColor: "rgba(200,162,124,0.3)", color: "#C8A27C", background: "rgba(200,162,124,0.06)" }}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Booking Link
            </button>
          )}
          <button
            type="button"
            onClick={() => { onClose(); setTimeout(() => onEdit(lodging), 150); }}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-full text-sm font-medium"
            style={{ background: "#C8A27C", color: "white" }}
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={() => { onClose(); setTimeout(() => onDelete(lodging.id), 150); }}
            className="w-10 h-10 rounded-full flex items-center justify-center border"
            style={{ borderColor: "rgba(220,80,80,0.2)", color: "#dc5050", background: "rgba(220,80,80,0.06)" }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}