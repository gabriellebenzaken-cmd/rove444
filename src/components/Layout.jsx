import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Map, Users, UserPlus, User, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";

const StarIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const NAV_ITEMS = [
  { path: "/", icon: Map, label: "Trips" },
  { path: "/groups", icon: Users, label: "Groups" },
  { path: "/friends", icon: UserPlus, label: "Friends" },
  { path: "/notifications", icon: Bell, label: "Alerts", isBell: true },
  { path: "/profile", icon: User, label: "Me" },
];

export default function Layout() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    base44.auth.me().then(me => {
      if (!me) return;
      base44.entities.Notification.filter({ user_email: me.email, is_read: false }, "-created_date", 50)
        .then(all => setUnreadCount((all || []).length))
        .catch(() => {});
    }).catch(() => {});
  }, [location.pathname]);

  return (
    <div className="bg-background font-sans" style={{ minHeight: '100dvh' }}>
      <main className="pb-24 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: "rgba(250,246,241,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,162,124,0.12)", boxShadow: "0 -1px 24px rgba(0,0,0,0.05)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-lg mx-auto flex items-center justify-around h-[62px] px-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 relative"
                style={{ color: isActive ? "#C8A27C" : "#B5A898", WebkitTapHighlightColor: "transparent" }}
              >
                <item.icon className={`h-[19px] w-[19px] ${isActive ? "stroke-[2.2px]" : "stroke-[1.6px]"}`} />
                {item.isBell && unreadCount > 0 && (
                  <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ background: "#C8A27C" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <span className={`text-[9px] tracking-wide ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}