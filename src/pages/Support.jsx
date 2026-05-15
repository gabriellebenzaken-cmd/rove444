import { Link } from "react-router-dom";
import { Mail, Globe, ArrowLeft } from "lucide-react";

export default function Support() {
  return (
    <div className="min-h-screen bg-background px-6 py-12 max-w-lg mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to Rove
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Support</h1>
        <p className="text-sm text-muted-foreground">We're here to help. Reach out anytime.</p>
      </div>

      <div className="space-y-4">
        <a
          href="mailto:support@travelrovr.app"
          className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-accent/40 transition-colors"
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
          className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-accent/40 transition-colors"
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

      <div className="mt-10 pt-8 border-t border-border flex flex-col gap-1.5">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Rove. All rights reserved.</p>
      </div>
    </div>
  );
}