import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  useEffect(() => { document.title = "Privacy | ROVR"; return () => { document.title = "ROVR"; }; }, []);
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 pt-14 pb-20">
        <div className="flex justify-center mb-8">
          <img
            src="https://media.base44.com/images/public/69d87cbb57171725f5686a39/3c282009f_FC110BC7-E543-45BD-8163-5032A691FBA8.png"
            alt="ROVR"
            className="h-7 w-auto opacity-20"
          />
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm mb-6 active:opacity-70 transition-opacity"
          style={{ color: "#C8A27C" }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to ROVR
        </Link>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#C8A27C" }}>Legal</p>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Effective Date: May 17, 2026</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">

          <p className="text-sm leading-relaxed text-muted-foreground">
            ROVR ("we", "our", or "us") is a collaborative travel planning and expense-sharing platform designed to help users organize trips, coordinate plans, and manage shared travel expenses. This Privacy Policy explains how we collect, use, store, and protect your information when you use ROVR.
          </p>

          <Section title="1. Information We Collect">
            <Subsection title="Account Information">
              <p>When you create an account, we collect:</p>
              <ul>
                <li>email address (used for authentication, trip participation, notifications, and account-related communication)</li>
                <li>full name and username</li>
                <li>profile photo (optional)</li>
                <li>bio (optional)</li>
              </ul>
              <p>Accounts are created with email and password. We do not use Google Sign-In or other third-party OAuth providers.</p>
            </Subsection>
            <Subsection title="Profile & Payment Information">
              <p>Users may optionally add:</p>
              <ul>
                <li>Venmo usernames</li>
                <li>PayPal usernames</li>
                <li>Cash App usernames</li>
                <li>Zelle information</li>
                <li>social media usernames or profile links</li>
              </ul>
              <p>This information is manually entered by users and is not verified by ROVR.</p>
            </Subsection>
            <Subsection title="Trip & Collaboration Data">
              <p>We collect information related to trips and group collaboration, including:</p>
              <ul>
                <li>trip names and destinations</li>
                <li>itineraries and schedules</li>
                <li>expenses and balances</li>
                <li>lodging and travel details</li>
                <li>group memberships</li>
                <li>invites and notifications</li>
                <li>messages and interactions within trips or groups</li>
              </ul>
            </Subsection>
            <Subsection title="Technical Information">
              <p>We may automatically collect limited technical information such as:</p>
              <ul>
                <li>device type</li>
                <li>browser type</li>
                <li>operating system</li>
                <li>IP address</li>
                <li>app usage analytics</li>
                <li>crash or performance diagnostics</li>
              </ul>
              <p>This information helps us maintain app functionality, security, and performance.</p>
            </Subsection>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use your information to:</p>
            <ul>
              <li>create and manage accounts</li>
              <li>provide trip planning and collaboration features</li>
              <li>manage shared expenses and balances</li>
              <li>facilitate coordination between users</li>
              <li>provide in-app notifications and updates</li>
              <li>improve app performance and reliability</li>
              <li>monitor usage and prevent abuse or unauthorized activity</li>
            </ul>
          </Section>

          <Section title="3. Payments">
            <p>ROVR does not process, store, transmit, or facilitate financial transactions.</p>
            <p>Payment handles (Venmo, PayPal, Cash App, Zelle) are user-provided references only. ROVR stores them solely to help trip members coordinate payments between themselves. All actual payments happen outside of ROVR through those third-party platforms.</p>
            <p>ROVR is not responsible for the accuracy, completion, or disputes arising from any payments made through third-party services.</p>
          </Section>

          <Section title="4. Location Information">
            <p>ROVR does not collect precise GPS location data from your device.</p>
            <p>Location-related information within the app is generally:</p>
            <ul>
              <li>manually entered by users</li>
              <li>based on trip destinations or travel details</li>
              <li>inferred approximately through standard server or IP-based operations used for security and analytics purposes</li>
            </ul>
          </Section>

          <Section title="5. How Information Is Shared">
            <p>We do not sell personal information.</p>
            <p>Information may be shared:</p>
            <ul>
              <li>with other users participating in the same trip or group</li>
              <li>with infrastructure and service providers used to operate the platform</li>
              <li>when required by law, legal process, or to protect the safety and integrity of the platform</li>
            </ul>
            <p>Depending on how you use ROVR, other users may see:</p>
            <ul>
              <li>usernames</li>
              <li>profile details</li>
              <li>payment handles</li>
              <li>social links</li>
              <li>trip participation</li>
              <li>expenses and balances</li>
              <li>shared trip content</li>
            </ul>
          </Section>

          <Section title="6. Third-Party Service Providers">
            <p>ROVR uses trusted third-party service providers to operate, maintain, and improve the platform. These providers may process limited account and usage information solely as necessary to deliver core app functionality. Categories of providers include:</p>
            <ul>
              <li><strong>Authentication</strong> — to securely verify user identity and manage login sessions</li>
              <li><strong>Cloud hosting &amp; infrastructure</strong> — to store data and serve the application reliably</li>
              <li><strong>Database management</strong> — to store and retrieve account, trip, and collaboration data</li>
              <li><strong>Analytics &amp; performance monitoring</strong> — to understand how the app is used and diagnose issues</li>
            </ul>
            <p>Information these providers may access is limited to what is necessary for their specific function — such as email addresses, usernames, profile information, or app usage data.</p>
            <p><strong>We do not sell user data to advertisers or any third parties.</strong> Data is only shared with service providers as strictly required to operate the platform securely and reliably.</p>
          </Section>

          <Section title="7. User Responsibility & Disputes">
            <p>ROVR is a coordination tool only and does not:</p>
            <ul>
              <li>verify expense accuracy</li>
              <li>guarantee payments</li>
              <li>mediate financial disputes</li>
              <li>enforce balances between users</li>
            </ul>
            <p>Users are solely responsible for verifying expenses, confirming payments, and resolving disputes with other users.</p>
          </Section>

          <Section title="8. Data Retention">
            <p>We retain information while accounts remain active or as reasonably necessary to provide the service.</p>
            <p>If you delete your account, certain information may remain visible within shared trip history, expense records, or group activity where necessary for continuity between other users.</p>
          </Section>

          <Section title="9. Security">
            <p>We use reasonable administrative and technical safeguards designed to protect your information.</p>
            <p>However, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.</p>
          </Section>

          <Section title="10. Your Rights & Choices">
            <p>You may:</p>
            <ul>
              <li>update your profile information at any time</li>
              <li>leave trips or groups</li>
              <li>request deletion of your account and associated data</li>
              <li>stop using the app at any time</li>
            </ul>
            <p>To request account or data deletion, contact: <a href="mailto:support@travelrovr.app" className="underline" style={{ color: "#C8A27C" }}>support@travelrovr.app</a>. We will process deletion requests within a reasonable timeframe. Some data visible to other trip members (e.g. shared expense history) may be retained for continuity.</p>
          </Section>

          <Section title="11. Affiliate Links & Recommendations">
            <p>ROVR may in the future display travel suggestions, booking links, or recommendations that include affiliate relationships. Any such links will be used to support the platform at no additional cost to users. ROVR does not currently receive compensation for any booking or travel recommendations displayed in the app.</p>
          </Section>

          <Section title="12. Children's Privacy">
            <p>ROVR is not intended for children under 13 years old, and we do not knowingly collect personal information from children under 13.</p>
          </Section>

          <Section title="13. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time.</p>
            <p>Continued use of ROVR after updates means you accept the revised policy.</p>
          </Section>

          <Section title="14. Contact">
            <p>If you have any questions regarding this Privacy Policy, please contact: <a href="mailto:support@travelrovr.app" className="underline" style={{ color: "#C8A27C" }}>support@travelrovr.app</a></p>
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