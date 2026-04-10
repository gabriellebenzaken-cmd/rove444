import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Map, Users, UserPlus, DollarSign, User, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/", icon: Map, label: "Trips" },
  { path: "/groups", icon: Users, label: "Groups" },
  { path: "/friends", icon: UserPlus, label: "Friends" },
  { path: "/costs", icon: DollarSign, label: "Costs" },
  { path: "/profile", icon: User, label: "Profile" },
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
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{background: 'rgba(250,246,241,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(200,162,124,0.15)', boxShadow: '0 -1px 24px rgba(0,0,0,0.05)'}}>
        <div className="max-w-lg mx-auto flex items-center justify-around h-[62px] px-2">
          {navItems.map((item) => {
            const isActive = item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200 ${
                  isActive ? "" : "text-[#B5A898] hover:text-[#8A7060]"
                }`}
                style={isActive ? { color: '#C8A27C' } : {}}
              >
                <item.icon className={`h-[19px] w-[19px] ${isActive ? "stroke-[2.2px]" : "stroke-[1.6px]"}`} />
                <span className={`text-[9px] tracking-wide ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          {/* Notifications */}
          <Link
            to="/notifications"
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200 relative ${
              location.pathname === "/notifications" ? "" : "text-[#B5A898] hover:text-[#8A7060]"
            }`}
            style={location.pathname === "/notifications" ? { color: '#C8A27C' } : {}}
          >
            <div className="relative">
              <Bell className={`h-[19px] w-[19px] ${location.pathname === "/notifications" ? "stroke-[2.2px]" : "stroke-[1.6px]"}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{background:'#C8A27C'}}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className={`text-[9px] tracking-wide ${location.pathname === "/notifications" ? "font-semibold" : "font-medium"}`}>Alerts</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}