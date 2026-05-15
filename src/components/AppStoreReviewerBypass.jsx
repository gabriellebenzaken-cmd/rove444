/**
 * AppStoreReviewerBypass
 *
 * Shown on the auth error / login screen when running inside a Capacitor
 * native wrapper. Lets Apple reviewers (and QA testers) enter a pre-issued
 * demo access token so they can evaluate the app without needing a real
 * Google account.
 *
 * The token input is intentionally hidden behind 5 taps on the ROVR logo
 * so it doesn't confuse regular users who somehow see this screen.
 *
 * TO USE:
 *   1. Create a dedicated test account in your Base44 dashboard.
 *   2. Log in as that user, grab the access_token from localStorage
 *      (localStorage.getItem('base44_access_token') in browser devtools).
 *   3. Put that token in the REVIEWER_TOKEN env var OR hard-code it below.
 *   4. Share the token with Apple in the App Review notes field.
 */

import { useState } from "react";

// Hard-code a long-lived demo token here (or leave empty and use the paste flow).
// Obtain from: localStorage.getItem('base44_access_token') while logged in as
// your demo/reviewer account in a browser.
const REVIEWER_TOKEN = import.meta.env.VITE_REVIEWER_TOKEN || "";

export default function AppStoreReviewerBypass({ onTokenApplied }) {
  const [tapCount, setTapCount] = useState(0);
  const [showInput, setShowInput] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  function handleLogoBadgeTap() {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) {
      setShowInput(true);
    }
  }

  function applyToken(token) {
    const t = (token || "").trim();
    if (!t) return;
    localStorage.setItem("base44_access_token", t);
    // Also set legacy key just in case
    localStorage.setItem("token", t);
    if (onTokenApplied) onTokenApplied();
    else window.location.reload();
  }

  // If a pre-issued reviewer token is baked in, offer a single "Use Demo Account" button
  // that only appears after 5 taps (keeps it hidden from normal users).
  if (!showInput && !REVIEWER_TOKEN) return null;

  return (
    <>
      {/* Invisible tap target — 5 taps reveals the panel */}
      {!showInput && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 w-16 h-16 z-50 opacity-0"
          onPointerDown={handleLogoBadgeTap}
          aria-hidden="true"
        />
      )}

      {showInput && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 px-4 pb-10">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              App Review Access
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">
              Paste the demo access token provided in the review notes, then tap Continue.
            </p>

            {REVIEWER_TOKEN ? (
              <button
                className="w-full h-10 rounded-full bg-[#C8A27C] text-white text-sm font-semibold mb-2"
                onPointerDown={() => applyToken(REVIEWER_TOKEN)}
              >
                Continue as Demo Reviewer
              </button>
            ) : (
              <>
                <textarea
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs p-2 mb-3 h-20 resize-none"
                  placeholder="Paste access token here…"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
                <button
                  className="w-full h-10 rounded-full bg-[#C8A27C] text-white text-sm font-semibold disabled:opacity-40"
                  disabled={!tokenInput.trim()}
                  onPointerDown={() => applyToken(tokenInput)}
                >
                  Continue
                </button>
              </>
            )}

            <button
              className="w-full mt-2 text-xs text-zinc-400"
              onPointerDown={() => { setShowInput(false); setTapCount(0); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}