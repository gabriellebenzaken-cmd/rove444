import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 pt-14 pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm mb-6 active:opacity-70 transition-opacity"
          style={{ color: "#C8A27C" }}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#C8A27C" }}>Legal</p>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-2">Effective Date: April 13, 2025</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            By using Rove, you agree to these Terms of Service. Please read them carefully.
          </p>

          <div>
            <h2 className="text-base font-semibold mb-2 text-foreground">1. Use of the Service</h2>
            <p>Rove is a travel planning and expense-sharing platform. You agree to use Rove only for lawful purposes and in a way that does not infringe the rights of others.</p>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-2 text-foreground">2. Account Responsibility</h2>
            <p>You are responsible for maintaining the security of your account and for all activities that occur under it. You must be at least 13 years old to use Rove.</p>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-2 text-foreground">3. Payments & Expenses</h2>
            <p>Rove does not process or facilitate payments. All financial transactions occur outside the app using third-party services. Rove is not responsible for any payment disputes or unresolved balances between users.</p>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-2 text-foreground">4. User Content</h2>
            <p>You retain ownership of content you post on Rove. By submitting content, you grant Rove a license to display it within the service. You are responsible for the content you share.</p>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-2 text-foreground">5. Limitation of Liability</h2>
            <p>Rove is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including disputes between users.</p>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-2 text-foreground">6. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may stop using Rove at any time.</p>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-2 text-foreground">7. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of Rove after changes means you accept the updated Terms.</p>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-2 text-foreground">8. Contact</h2>
            <p>Questions? Contact us at <a href="mailto:support@rove.app" className="underline" style={{ color: "#C8A27C" }}>support@rove.app</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}