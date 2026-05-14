import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Effective Date: April 13, 2025</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">

          <p className="text-sm leading-relaxed text-muted-foreground">
            ROVR ("we", "our", or "us") is a travel planning and expense-sharing platform designed to help users organize group trips. This Privacy Policy explains how we collect, use, and protect your information.
          </p>

          <Section title="1. Information We Collect">
            <Subsection title="Account Information">
              <ul>
                <li>Name and email address (provided through Google Sign-In)</li>
                <li>Username and profile details you choose to add</li>
              </ul>
            </Subsection>
            <Subsection title="Profile & Payment Information">
              <ul>
                <li>Optional payment handles (such as Venmo, Cash App, PayPal, or Zelle usernames)</li>
                <li>This information is manually entered by users and is not verified by ROVR</li>
              </ul>
            </Subsection>
            <Subsection title="Trip & App Data">
              <ul>
                <li>Trip details (locations, dates, plans)</li>
                <li>Expenses, balances, and payment activity within trips</li>
                <li>Messages and interactions within trips (such as chat or invites)</li>
              </ul>
            </Subsection>
            <Subsection title="Technical Information">
              <ul>
                <li>Device and browser type</li>
                <li>IP address and general usage data</li>
              </ul>
            </Subsection>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use your information to:</p>
            <ul>
              <li>Create and manage your account</li>
              <li>Enable trip planning and collaboration</li>
              <li>Track shared expenses and balances</li>
              <li>Facilitate payment coordination between users</li>
              <li>Provide in-app notifications (such as invites and updates)</li>
              <li>Improve app functionality and performance</li>
            </ul>
          </Section>

          <Section title="3. Payments">
            <p>ROVR does not process, store, or facilitate financial transactions.</p>
            <p>All payments occur outside of ROVR using third-party platforms such as Venmo, PayPal, Cash App, or Zelle. ROVR only provides links or identifiers to help users coordinate payments.</p>
          </Section>

          <Section title="4. Location Information">
            <p>ROVR does not collect or track precise GPS location data.</p>
            <p>Any location information in the app is manually entered by users (e.g., trip destinations).</p>
          </Section>

          <Section title="5. How Information is Shared">
            <p>We do not sell your personal data.</p>
            <p>Information may be shared:</p>
            <ul>
              <li>With other users in your trip (such as your username, payment handles, expenses, and balances)</li>
              <li>With service providers that help operate the app (e.g., hosting infrastructure)</li>
            </ul>
          </Section>

          <Section title="6. User Responsibility & Disputes">
            <p>ROVR is a coordination tool and does not:</p>
            <ul>
              <li>Verify the accuracy of expenses</li>
              <li>Guarantee that payments will be made</li>
              <li>Resolve disputes between users</li>
            </ul>
            <p>Users are solely responsible for verifying expenses and completing payments.</p>
          </Section>

          <Section title="7. Data Retention">
            <p>We retain your data while your account is active or as needed to provide the service.</p>
            <p>If you delete your account, your personal data will be removed, though certain trip or transaction records may remain as part of shared group history.</p>
          </Section>

          <Section title="8. Security">
            <p>We take reasonable measures to protect your information, but no method of transmission or storage is completely secure.</p>
          </Section>

          <Section title="9. Your Rights & Choices">
            <p>You may:</p>
            <ul>
              <li>Update your profile information</li>
              <li>Leave trips at any time</li>
              <li>Delete your account</li>
              <li>Stop using the app whenever you choose</li>
            </ul>
          </Section>

          <Section title="10. Children's Privacy">
            <p>ROVR is not intended for users under 13, and we do not knowingly collect personal information from children.</p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. Continued use of ROVR means you accept any updates.</p>
          </Section>

          <Section title="12. Contact">
            <p>If you have questions, contact us at: <a href="mailto:support@rovr.app" className="underline" style={{ color: "#C8A27C" }}>support@rovr.app</a></p>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-2" style={{ color: "#2A2018" }}>{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground space-y-2">{children}</div>
    </div>
  );
}

function Subsection({ title, children }) {
  return (
    <div className="mt-2">
      <h3 className="text-sm font-semibold mb-1" style={{ color: "#5A4A3A" }}>{title}</h3>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}