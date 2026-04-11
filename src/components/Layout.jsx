import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Map, Users, UserPlus, Wallet, User, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";

const NAV_ITEMS = [
  { path: "/", icon: Map, label: "Trips" },
  { path: "/groups", icon: Users, label: "Groups" },
  { path: "/friends", icon: UserPlus, label: "Friends" },
  { path: "/costs", icon: Wallet, label: "Costs" },
  { path: "/profile", icon: User, label: "Me" },
];

export default function Layout() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [tabStacks, setTabStacks] = useState({
    "/": ["/"],
    "/groups": ["/groups"],
    "/friends": ["/friends"],
    "/costs": ["/costs"],
    "/profile": ["/profile"],
  });

  // Track current tab and update stacks
  useEffect(() => {
    const currentTab = NAV_ITEMS.find((item) =>
      location.pathname === item.path || location.pathname.startsWith(item.path)
    )?.path;

    if (currentTab && location.pathname !== tabStacks[currentTab]?.[tabStacks[currentTab].length - 1]) {
      setTabStacks((prev) => ({
        ...prev,
        [currentTab]: [...(prev[currentTab] || [currentTab]), location.pathname],
      }));
    }
  }, [location.pathname]);

  const handleTabClick = (path) => {
    if (tabStacks[path]?.[tabStacks[path].length - 1] === location.pathname) {
      // Reset stack to root on active tab click
      setTabStacks((prev) => ({ ...prev, [path]: [path] }));
    }
  };

  // Hide top bell on detail pages with their own header
  const hideTopBell = location.pathname.startsWith("/trip/") ||
    location.pathname.startsWith("/group/") ||
    location.pathname.startsWith("/join/") ||
    location.pathname === "/notifications";

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
      {/* Top-right bell — only on main pages */}
      {!hideTopBell && (
       <Link
         to="/notifications"
         className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center"
         style={{ top: "calc(1rem + env(safe-area-inset-top))", background: "rgba(250,246,241,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(200,162,124,0.2)", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", WebkitTapHighlightColor: "transparent" }}
        >
          <Bell className="h-4 w-4" style={{ color: "#C8A27C" }} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ background: "#C8A27C" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      )}

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: "rgba(250,246,241,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,162,124,0.12)", boxShadow: "0 -1px 24px rgba(0,0,0,0.05)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-lg mx-auto flex items-center justify-around h-[62px] px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
            return (
              <Link
                 key={item.path}
                 to={item.path}
                 onClick={() => handleTabClick(item.path)}
                 className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200"
                 style={{ color: isActive ? "#C8A27C" : "#B5A898", WebkitTapHighlightColor: "transparent" }}
              >
                <item.icon className={`h-[19px] w-[19px] ${isActive ? "stroke-[2.2px]" : "stroke-[1.6px]"}`} />
                <span className={`text-[9px] tracking-wide ${isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}