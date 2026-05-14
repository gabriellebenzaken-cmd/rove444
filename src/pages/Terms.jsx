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

          <p>Welcome to ROVR. By using the app, you agree to the following terms.</p>

          <Section title="1. Overview">
            <p>ROVR is a travel planning and expense-sharing platform that allows users to organize trips, track shared costs, and coordinate payments with others.</p>
            <p>ROVR does not process payments or act as a financial intermediary.</p>
          </Section>

          <Section title="2. User Accounts">
            <ul>
              <li>You must sign in using a valid Google account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You are responsible for all activity that occurs under your account</li>
            </ul>
          </Section>

          <Section title="3. User Content">
            <p>You are responsible for all content you create or share on ROVR, including:</p>
            <ul>
              <li>Trip details</li>
              <li>Expenses</li>
              <li>Payment information</li>
              <li>Messages</li>
            </ul>
            <p className="mt-2">You agree not to:</p>
            <ul>
              <li>Enter false or misleading information for fraudulent purposes</li>
              <li>Impersonate another person</li>
              <li>Use the app for unlawful activity</li>
            </ul>
          </Section>

          <Section title="4. Expenses & Payments">
            <p>Rove allows users to track shared expenses, but:</p>
            <ul>
              <li>We do not verify the accuracy of any expenses</li>
              <li>We do not enforce or guarantee payments</li>
              <li>We are not responsible for disputes between users</li>
            </ul>
            <p className="mt-2">All payments occur outside of ROVR using third-party platforms such as Venmo, PayPal, Cash App, or Zelle.</p>
            <p className="mt-2">Users are solely responsible for:</p>
            <ul>
              <li>Verifying what they owe</li>
              <li>Completing payments</li>
              <li>Resolving any disagreements</li>
            </ul>
          </Section>

          <Section title="5. Leaving a Trip & Member Removal">
            <ul>
              <li>Users may leave a trip at any time</li>
              <li>Trip admins may remove members</li>
            </ul>
            <p className="mt-2">Leaving or being removed from a trip:</p>
            <ul>
              <li>Does not erase past expenses or balances</li>
              <li>Does not remove financial obligations between users</li>
            </ul>
            <p className="mt-2">ROVR is not responsible for collecting or enforcing payments after a user leaves a trip.</p>
          </Section>

          <Section title="6. No Financial Liability">
            <p>ROVR is a coordination tool only.</p>
            <p>We are not liable for:</p>
            <ul>
              <li>Unpaid balances</li>
              <li>Incorrect expense entries</li>
              <li>Financial losses between users</li>
            </ul>
          </Section>

          <Section title="7. Availability & Changes">
            <p>We may update, modify, or discontinue parts of the app at any time without notice.</p>
            <p>We do not guarantee uninterrupted or error-free service.</p>
          </Section>

          <Section title="8. Termination">
            <p>We may suspend or terminate accounts that:</p>
            <ul>
              <li>Violate these terms</li>
              <li>Engage in harmful or abusive behavior</li>
              <li>Use the app unlawfully</li>
            </ul>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>To the fullest extent permitted by law, ROVR is not liable for any indirect, incidental, or consequential damages arising from the use of the app.</p>
          </Section>

          <Section title="10. Changes to Terms">
            <p>We may update these Terms from time to time. Continued use of ROVR means you accept the updated Terms.</p>
          </Section>

          <Section title="11. Contact">
            <p>If you have any questions, contact us at: <a href="mailto:support@rovr.app" className="underline font-semibold" style={{ color: "#C8A27C" }}>support@rovr.app</a></p>
          </Section>

          <div className="rounded-2xl p-4 mt-6" style={{ background: "rgba(200,162,124,0.1)", border: "1px solid rgba(200,162,124,0.2)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#C8A27C" }}>TL;DR</p>
            <p className="text-sm">ROVR helps you organize trips and track costs, but you are responsible for your own payments and decisions.</p>
          </div>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-2 text-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}