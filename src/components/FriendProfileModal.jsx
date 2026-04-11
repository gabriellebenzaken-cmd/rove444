import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Instagram, Twitter, Globe } from "lucide-react";

const socialLinks = [
  { key: "instagram", label: "Instagram", icon: "📷", href: (v) => `https://instagram.com/${v.replace(/^@/, "")}` },
  { key: "twitter",   label: "X / Twitter", icon: "𝕏", href: (v) => `https://x.com/${v.replace(/^@/, "")}` },
  { key: "tiktok",    label: "TikTok",    icon: "🎵", href: (v) => `https://tiktok.com/@${v.replace(/^@/, "")}` },
  { key: "snapchat",  label: "Snapchat",  icon: "👻", href: (v) => `https://snapchat.com/add/${v.replace(/^@/, "")}` },
];

const payLinks = [
  { key: "venmo",   label: "Venmo",    href: (v) => `https://venmo.com/${v.replace(/^@/, "")}` },
  { key: "cashapp", label: "Cash App", href: (v) => `https://cash.app/$${v.replace(/^\$/, "")}` },
  { key: "paypal",  label: "PayPal",   href: (v) => `https://paypal.me/${v.replace(/^[@\/]/, "")}` },
  { key: "zelle",   label: "Zelle",    href: null },
];

export default function FriendProfileModal({ friend, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!friend) return;
    base44.entities.UserProfile.filter({ user_email: friend.email }, "-created_date", 1)
      .then((results) => {
        setProfile(results[0] || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [friend?.email]);

  if (!friend) return null;

  const displayName = profile?.full_name || friend.full_name || friend.display_name || "Unknown";
  const username = profile?.username || friend.username;
  const photo = profile?.profile_photo || friend.profile_photo;

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl max-h-[85vh] overflow-y-auto"
        style={{ background: "#FAF7F4" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: "rgba(200,162,124,0.3)" }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: "rgba(200,162,124,0.15)" }}
        >
          <X className="h-4 w-4" style={{ color: "#9A8A7A" }} />
        </button>

        <div className="px-6 pb-10 pt-2">
          {/* Avatar + name */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full mb-3 flex items-center justify-center text-2xl font-bold" style={{ background: "rgba(200,162,124,0.18)", color: "#C8A27C" }}>
              {photo ? (
                <img src={photo} alt="" className="w-20 h-20 rounded-full object-cover" />
              ) : displayName[0]}
            </div>
            <h2 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>{displayName}</h2>
            {username && <p className="text-sm mt-0.5" style={{ color: "#B0A090" }}>@{username}</p>}
            {friend.email && !username && <p className="text-sm mt-0.5" style={{ color: "#B0A090" }}>{friend.email}</p>}
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#C8A27C", borderTopColor: "transparent" }} />
            </div>
          ) : (
            <>
              {/* Payment */}
              {payLinks.some(p => profile?.[p.key]) && (
                <div className="mb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "#C8A27C" }}>Pay</p>
                  <div className="flex flex-wrap gap-2">
                    {payLinks.map(({ key, label, href }) => {
                      const val = profile?.[key];
                      if (!val) return null;
                      return href ? (
                        <a key={key} href={href(val)} target="_blank" rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-full text-sm font-medium active:opacity-70"
                          style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(200,162,124,0.2)", color: "#3A3028" }}>
                          {label} ↗
                        </a>
                      ) : (
                        <span key={key} className="px-3.5 py-2 rounded-full text-sm"
                          style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(200,162,124,0.2)", color: "#3A3028" }}>
                          Zelle: {val}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Social */}
              {socialLinks.some(s => profile?.[s.key]) && (
                <div className="mb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "#C8A27C" }}>Social</p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map(({ key, label, icon, href }) => {
                      const val = profile?.[key];
                      if (!val) return null;
                      return (
                        <a key={key} href={href(val)} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm active:opacity-70"
                          style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(200,162,124,0.2)", color: "#3A3028" }}>
                          <span>{icon}</span> {label} ↗
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {!profile && (
                <p className="text-sm text-center py-4" style={{ color: "#B0A090" }}>No profile info available</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}