import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-2">Effective Date: April 13, 2025</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">

          <p>Welcome to ROVR. By accessing or using the app, you agree to these Terms of Service.</p>

          <Section title="1. Overview">
            <p>ROVR is a collaborative travel planning and expense-sharing platform that allows users to organize trips, coordinate itineraries, manage shared expenses, and connect with other travelers.</p>
            <p>ROVR does not process payments, hold funds, or act as a financial intermediary.</p>
          </Section>

          <Section title="2. Eligibility">
            <p>You must be at least 13 years old to use ROVR.</p>
            <p>By using the app, you represent that you are legally permitted to agree to these Terms.</p>
          </Section>

          <Section title="3. User Accounts">
            <p>To use certain features, you must sign in using a valid account supported by ROVR authentication services.</p>
            <p>You are responsible for:</p>
            <ul>
              <li>maintaining the security of your account</li>
              <li>keeping your login credentials confidential</li>
              <li>all activity that occurs under your account</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms or harm the platform or its users.</p>
          </Section>

          <Section title="4. User Content & Shared Information">
            <p>You are responsible for all content you create, upload, or share within ROVR, including:</p>
            <ul>
              <li>trip details</li>
              <li>itineraries</li>
              <li>expenses</li>
              <li>messages</li>
              <li>payment usernames/handles</li>
              <li>social media usernames/links</li>
              <li>profile information</li>
            </ul>
            <p>By using ROVR, you acknowledge that certain information may be visible to other trip or group members depending on how you use the platform.</p>
            <p>You agree not to:</p>
            <ul>
              <li>impersonate another person</li>
              <li>use false or misleading information for fraudulent purposes</li>
              <li>upload unlawful, abusive, or harmful content</li>
              <li>use the app for illegal activity</li>
            </ul>
          </Section>

          <Section title="5. Expenses & Payments">
            <p>ROVR allows users to organize and track shared expenses between travelers.</p>
            <p>However:</p>
            <ul>
              <li>ROVR does not verify the accuracy of expenses</li>
              <li>ROVR does not process or enforce payments</li>
              <li>ROVR does not guarantee repayment between users</li>
              <li>ROVR is not responsible for disputes between users</li>
            </ul>
            <p>All payments occur outside of ROVR through third-party services such as Venmo, PayPal, Cash App, Zelle, or other external payment platforms.</p>
            <p>Users are solely responsible for:</p>
            <ul>
              <li>verifying balances</li>
              <li>completing payments</li>
              <li>resolving disputes</li>
              <li>confirming payment accuracy</li>
            </ul>
          </Section>

          <Section title="6. Leaving Trips & Member Removal">
            <p>Users may leave a trip or group at any time.</p>
            <p>Trip or group admins may remove members when appropriate.</p>
            <p>Leaving or being removed from a trip:</p>
            <ul>
              <li>does not erase historical expenses or balances</li>
              <li>does not remove financial obligations between users</li>
              <li>does not delete shared trip records automatically</li>
            </ul>
            <p>ROVR is not responsible for collecting or enforcing payments after users leave a trip.</p>
          </Section>

          <Section title="7. Data & Privacy">
            <p>ROVR collects and stores certain account and user-generated information necessary for app functionality, including profile information, trip data, shared expenses, and social/payment handles.</p>
            <p>For more information about how data is collected, stored, and used, please review our Privacy Policy.</p>
          </Section>

          <Section title="8. Availability & Changes">
            <p>ROVR is provided on an "as is" and "as available" basis without warranties of any kind.</p>
            <p>We may update, modify, suspend, or discontinue parts of the app at any time without notice.</p>
            <p>We do not guarantee uninterrupted or error-free service.</p>
          </Section>

          <Section title="9. Termination">
            <p>We may suspend or terminate accounts that:</p>
            <ul>
              <li>violate these Terms</li>
              <li>engage in abusive or harmful behavior</li>
              <li>misuse the platform</li>
              <li>use the app unlawfully</li>
            </ul>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>To the fullest extent permitted by law, ROVR and its operators are not liable for:</p>
            <ul>
              <li>unpaid balances</li>
              <li>inaccurate expense entries</li>
              <li>user disputes</li>
              <li>financial losses between users</li>
              <li>indirect, incidental, or consequential damages arising from use of the app</li>
            </ul>
          </Section>

          <Section title="11. Account Deletion">
            <p>Users may request deletion of their account and associated data by contacting: <a href="mailto:support@travelrovr.app" className="underline font-semibold" style={{ color: "#C8A27C" }}>support@travelrovr.app</a></p>
            <p>Some records related to shared trips, expenses, or group activity may remain visible to other users where necessary for historical or financial continuity.</p>
          </Section>

          <Section title="12. Changes to These Terms">
            <p>We may update these Terms from time to time.</p>
            <p>Continued use of ROVR after updates means you accept the revised Terms.</p>
          </Section>

          <Section title="13. Contact">
            <p>If you have any questions regarding these Terms, please contact: <a href="mailto:support@travelrovr.app" className="underline font-semibold" style={{ color: "#C8A27C" }}>support@travelrovr.app</a></p>
          </Section>

          <div className="rounded-2xl p-4 mt-6" style={{ background: "rgba(200,162,124,0.1)", border: "1px solid rgba(200,162,124,0.2)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#C8A27C" }}>TL;DR</p>
            <p className="text-sm">ROVR helps travelers organize trips, coordinate shared plans, and track expenses — but users remain responsible for their own payments, decisions, and interactions with others.</p>
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