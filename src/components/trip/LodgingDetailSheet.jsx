import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MapPin, Moon, Edit2, Trash2, ExternalLink, Users, FileText, Hotel } from "lucide-react";
import { format } from "date-fns";

function InfoPanel({ label, value, sub }) {
  return (
    <div
      className="flex-1 rounded-xl px-3.5 py-3"
      style={{
        background: "rgba(200,162,124,0.07)",
        border: "1px solid rgba(200,162,124,0.16)",
      }}
    >
      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-[15px] font-bold tracking-tight text-foreground leading-none">
        {value || "—"}
      </p>
      {sub && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      )}
    </div>
  );
}

export default function LodgingDetailSheet({ lodging, open, onClose, onEdit, onDelete }) {
  if (!lodging) return null;

  const nights =
    lodging.check_in && lodging.check_out
      ? Math.round(
          (new Date(lodging.check_out) - new Date(lodging.check_in)) / 86400000
        )
      : null;

  const checkIn = lodging.check_in
    ? format(new Date(lodging.check_in + "T00:00:00"), "EEE, MMM d")
    : null;
  const checkOut = lodging.check_out
    ? format(new Date(lodging.check_out + "T00:00:00"), "EEE, MMM d")
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl z-50 p-0 overflow-hidden"
        style={{
          width: "calc(100vw - 32px)",
          maxWidth: "480px",
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
        }}
      >
        {/* Hero image */}
        {lodging.image_url ? (
          <div className="relative w-full h-52 bg-muted overflow-hidden">
            <img
              src={lodging.image_url}
              alt={lodging.name}
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.82)" }}
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)",
              }}
            />
            {/* Name + location on image */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-8">
              <p className="text-white text-xl font-bold tracking-tight leading-tight drop-shadow">
                {lodging.name}
              </p>
              {lodging.address && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-white/70 shrink-0" />
                  <p className="text-[12px] text-white/75 truncate leading-none">
                    {lodging.address}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* No-image header */
          <div
            className="px-5 pt-5 pb-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(200,162,124,0.12) 0%, rgba(200,162,124,0.04) 100%)",
              borderBottom: "1px solid rgba(200,162,124,0.12)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(200,162,124,0.15)" }}
              >
                <Hotel className="h-5 w-5" style={{ color: "#C8A27C" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[17px] font-bold tracking-tight text-foreground leading-tight">
                  {lodging.name}
                </p>
                {lodging.address && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-[12px] text-muted-foreground truncate">
                      {lodging.address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4 space-y-4 bg-card">

          {/* Check-in / Check-out panels */}
          {(checkIn || checkOut) && (
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Stay Dates
              </p>
              <div className="flex items-stretch gap-2">
                <InfoPanel label="Check-in" value={checkIn} />

                {nights > 0 && (
                  <div className="flex flex-col items-center justify-center gap-0.5 px-1">
                    <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {nights}n
                    </span>
                  </div>
                )}

                <InfoPanel label="Check-out" value={checkOut} />

                {lodging.price_per_night && (
                  <InfoPanel
                    label="Rate"
                    value={`$${lodging.price_per_night}`}
                    sub="/ night"
                  />
                )}
              </div>
            </div>
          )}

          {/* Guests */}
          {lodging.guest_emails?.length > 0 && (
            <div
              className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
              style={{
                background: "rgba(200,162,124,0.05)",
                border: "1px solid rgba(200,162,124,0.12)",
              }}
            >
              <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                {lodging.guest_emails.join(" · ")}
              </p>
            </div>
          )}

          {/* Notes */}
          {lodging.notes && (
            <div
              className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
              style={{
                background: "rgba(200,162,124,0.05)",
                border: "1px solid rgba(200,162,124,0.12)",
              }}
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                {lodging.notes}
              </p>
            </div>
          )}

          {/* Divider */}
          <div
            style={{ borderTop: "1px solid rgba(200,162,124,0.12)" }}
            className="pt-1"
          >
            <div className="flex items-center gap-2">
              {/* Booking link — subtle pill */}
              {lodging.booking_url && (
                <button
                  type="button"
                  onClick={() => window.open(lodging.booking_url, "_blank")}
                  className="flex items-center gap-1.5 px-3.5 h-9 rounded-full text-[12px] font-medium"
                  style={{
                    border: "1px solid rgba(200,162,124,0.28)",
                    color: "#C8A27C",
                    background: "rgba(200,162,124,0.06)",
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                  View Booking
                </button>
              )}

              <div className="flex-1" />

              {/* Delete — ghost icon */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setTimeout(() => onDelete(lodging.id), 150);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  border: "1px solid rgba(220,80,80,0.18)",
                  color: "#dc5050",
                  background: "rgba(220,80,80,0.05)",
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              {/* Edit — primary pill */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setTimeout(() => onEdit(lodging), 150);
                }}
                className="flex items-center gap-1.5 px-4 h-9 rounded-full text-[12px] font-semibold"
                style={{ background: "#C8A27C", color: "white" }}
              >
                <Edit2 className="h-3 w-3" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}