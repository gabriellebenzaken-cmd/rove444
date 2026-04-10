import { Outlet, Link, useLocation } from "react-router-dom";
import { Map, Users, UserPlus, DollarSign, User } from "lucide-react";

const navItems = [
  { path: "/", icon: Map, label: "Trips" },
  { path: "/groups", icon: Users, label: "Groups" },
  { path: "/friends", icon: UserPlus, label: "Friends" },
  { path: "/costs", icon: DollarSign, label: "Costs" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function Layout() {
  const location = useLocation();

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
        </div>
      </nav>
    </div>
  );
}