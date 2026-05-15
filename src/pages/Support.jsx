import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, Globe, ArrowLeft } from "lucide-react";

export default function Support() {
  useEffect(() => { document.title = "Support | ROVR"; return () => { document.title = "ROVR"; }; }, []);
  return (
    <div className="min-h-screen bg-background px-6 py-12 max-w-lg mx-auto">

      {/* Subtle logo mark */}
      <div className="flex justify-center mb-10">
        <img
          src="https://media.base44.com/images/public/69d87cbb57171725f5686a39/3c282009f_FC110BC7-E543-45BD-8163-5032A691FBA8.png"
          alt="ROVR"
          className="h-8 w-auto opacity-20"
          style={{ filter: "var(--logo-filter, none)" }}
        />
      </div>

      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to ROVR
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Support</h1>
        <p className="text-sm text-muted-foreground">We're here to help. Reach out anytime.</p>
      </div>

      <div className="space-y-4">
        <a
          href="mailto:support@travelrovr.app"
          className="flex items-center gap-3 p-4 rounded-2xl transition-colors"
          style={{
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.35)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
          }}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Email Support</p>
            <p className="text-xs text-muted-foreground">support@travelrovr.app</p>
          </div>
        </a>

        <a
          href="https://travelrovr.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 rounded-2xl transition-colors"
          style={{
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.35)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
          }}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Website</p>
            <p className="text-xs text-muted-foreground">travelrovr.app</p>
          </div>
        </a>
      </div>

      <div className="mt-10 pt-8 flex flex-col gap-1.5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
        <p className="text-xs text-muted-foreground opacity-50">© {new Date().getFullYear()} ROVR. All rights reserved.</p>
      </div>
    </div>
  );
}