import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Guidelines() {
  useEffect(() => { document.title = "Community Guidelines | ROVR"; return () => { document.title = "ROVR"; }; }, []);

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
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service &amp; Community Guidelines</h1>
          <p className="text-sm text-muted-foreground mt-2">Effective Date: May 17, 2026</p>
        </div>

        {/* Intro */}
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(200,162,124,0.1)", border: "1px solid rgba(200,162,124,0.2)" }}>
          <p className="text-sm leading-relaxed text-muted-foreground">
            ROVR is a travel planning and social coordination platform designed to help groups organize trips, communicate, and manage shared experiences. By creating an account or using ROVR, you agree to these Community Guidelines and our{" "}
            <Link to="/terms" className="underline font-semibold" style={{ color: "#C8A27C" }}>Terms of Service</Link> and{" "}
            <Link to="/privacy" className="underline font-semibold" style={{ color: "#C8A27C" }}>Privacy Policy</Link>.
          </p>
        </div>

        <div className="space-y-7 text-sm leading-relaxed text-muted-foreground">

          <Section title="1. Platform Purpose">
            <p>ROVR is intended solely as a platform for organizing trips, coordinating travel plans, and communicating with group members. The platform is designed for lawful, respectful social travel coordination only.</p>
            <p>ROVR is not a general social network, marketplace, dating app, or communication tool for purposes unrelated to travel planning and group coordination.</p>
          </Section>

          <Section title="2. Prohibited Content & Conduct">
            <p>By using ROVR, you agree <strong className="text-foreground">not</strong> to upload, post, share, organize, distribute, or communicate any content that includes:</p>
            <ul>
              <li>Nudity, sexually explicit material, or sexual fetish content</li>
              <li>Depictions or descriptions of sexual activity or exploitation</li>
              <li><strong className="text-foreground">Any sexualized content involving minors, under any circumstances — this is an absolute prohibition and will result in immediate account termination and referral to law enforcement</strong></li>
              <li>Harassment, bullying, threats, intimidation, stalking, or abusive behavior directed at any person</li>
              <li>Hate speech, discriminatory remarks, slurs, or content targeting individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, national origin, or any other protected characteristic</li>
              <li>Graphic violence, gore, violent threats, or promotion of physical harm</li>
              <li>Illegal activity or promotion, facilitation, or coordination of illegal activity</li>
              <li>References to, promotion of, sale of, or coordination involving illegal drugs or controlled substances</li>
              <li>Spam, scams, phishing attempts, impersonation, fraud, or malicious links</li>
              <li>Content intended to exploit, endanger, groom, solicit, or harm minors in any way</li>
              <li>Any content that violates applicable laws, App Store or Google Play policies, or platform safety standards</li>
            </ul>
            <p>These prohibitions apply to all user-generated content including but not limited to: chat messages, trip names, captions, descriptions, bios, itinerary notes, poll questions, uploaded photos, links, and profile information.</p>
          </Section>

          <Section title="3. User Responsibility & Conduct">
            <p>Users are solely responsible for:</p>
            <ul>
              <li>their own conduct, decisions, and communications within the platform</li>
              <li>all content they upload, share, or distribute</li>
              <li>their travel arrangements, interactions, and activities organized through the app</li>
              <li>complying with all applicable local, state, federal, and international laws while using ROVR</li>
            </ul>
            <p>Any use of ROVR to facilitate illegal activity, exploitation, trafficking, violence, fraud, or harmful conduct is strictly prohibited and may result in immediate account termination and cooperation with law enforcement.</p>
          </Section>

          <Section title="4. Liability & Platform Limitations">
            <p>ROVR is strictly a travel planning and coordination platform. ROVR does not organize, supervise, verify, endorse, monitor, or guarantee the safety, legality, quality, accuracy, or conduct of any trip, meetup, event, destination, activity, accommodation, transportation arrangement, or user interaction.</p>
            <p>ROVR is not responsible or liable for:</p>
            <ul>
              <li>accidents, injuries, or personal harm</li>
              <li>unsafe travel conditions or destinations</li>
              <li>disputes, disagreements, or conflicts between users</li>
              <li>harassment, misconduct, or abuse between users</li>
              <li>theft, fraud, or scams</li>
              <li>illegal acts or criminal activity</li>
              <li>drug or alcohol-related incidents</li>
              <li>user-generated content accuracy or appropriateness</li>
              <li>third-party services, bookings, payment apps, airlines, hotels, rideshares, or accommodations</li>
              <li>damages, losses, or incidents occurring during or after trips or interactions coordinated through the app</li>
            </ul>
            <p>To the fullest extent permitted by law, ROVR and its operators disclaim all liability for indirect, incidental, consequential, or punitive damages arising from use of the platform.</p>
          </Section>

          <Section title="5. Content Moderation & Enforcement">
            <p>User-generated content — including chats, trip names, captions, descriptions, itinerary notes, polls, and uploaded photos — is subject to moderation and removal at ROVR's discretion.</p>
            <p>ROVR reserves the right to:</p>
            <ul>
              <li>remove content that violates these guidelines, with or without notice</li>
              <li>restrict access to features or content</li>
              <li>suspend accounts pending review</li>
              <li>permanently terminate accounts for violations</li>
              <li>cooperate with law enforcement where legally required, especially regarding threats, exploitation, illegal activity, or any content involving minors</li>
            </ul>
            <p>Repeat violations will result in permanent account bans.</p>
          </Section>

          <Section title="6. Safety & Reporting">
            <div className="rounded-xl px-4 py-3 mb-3" style={{ background: "rgba(200,162,124,0.1)", border: "1px solid rgba(200,162,124,0.2)" }}>
              <p className="font-semibold text-foreground mb-1">See something, say something.</p>
              <p>Help us keep ROVR safe for everyone.</p>
            </div>
            <p>If you see anything concerning, inappropriate, unsafe, exploitative, threatening, or in violation of these guidelines, please report it immediately.</p>
            <p>Users may report content, chats, trip activity, photos, profiles, or behavior that violates our Community Guidelines by contacting:</p>
            <p className="mt-2">
              <a href="mailto:support@travelrovr.app" className="font-semibold underline" style={{ color: "#C8A27C" }}>
                support@travelrovr.app
              </a>
            </p>
            <p className="mt-3">Please report any of the following:</p>
            <ul>
              <li>Unsafe or harmful behavior</li>
              <li>Harassment, bullying, or threats</li>
              <li>Hate speech or discriminatory content</li>
              <li>Sexual, explicit, or inappropriate content</li>
              <li>Any content or behavior involving minors</li>
              <li>Suspected illegal activity, exploitation, or trafficking</li>
              <li>Impersonation or fraud</li>
              <li>Spam or scam activity</li>
            </ul>
            <p className="mt-3">When you submit a report:</p>
            <ul>
              <li>Reports may be reviewed by the ROVR team</li>
              <li>Content may be removed pending review</li>
              <li>Accounts may be suspended or terminated for violations</li>
              <li>Severe violations involving exploitation, threats, illegal activity, or minors may be escalated to appropriate authorities where legally required</li>
            </ul>
          </Section>

          <Section title="7. Account Termination">
            <p>ROVR may suspend or permanently terminate accounts that:</p>
            <ul>
              <li>violate these Community Guidelines or Terms of Service</li>
              <li>engage in abusive, harmful, or illegal behavior</li>
              <li>misuse the platform or harm other users</li>
              <li>are involved in exploitation, fraud, or criminal activity</li>
            </ul>
            <p>Repeat or severe violations will result in permanent bans with no appeal.</p>
          </Section>

          <Section title="8. Changes to These Guidelines">
            <p>We may update these Community Guidelines from time to time. Continued use of ROVR after updates means you accept the revised guidelines.</p>
          </Section>

          <Section title="9. Contact">
            <p>
              For safety reports, trust &amp; safety concerns, harassment, inappropriate content, illegal activity, or issues involving minors, contact us immediately at:{" "}
              <a href="mailto:support@travelrovr.app" className="underline font-semibold" style={{ color: "#C8A27C" }}>
                support@travelrovr.app
              </a>
            </p>
          </Section>

        </div>

        {/* Footer links */}
        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link to="/terms" className="underline hover:opacity-70">Terms of Service</Link>
          <Link to="/privacy" className="underline hover:opacity-70">Privacy Policy</Link>
          <a href="mailto:support@travelrovr.app" className="underline hover:opacity-70">Contact Support</a>
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