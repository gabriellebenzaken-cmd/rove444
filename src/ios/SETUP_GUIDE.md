# ROVR iOS – Clean Setup Guide

## Why you see "Missing package product 'CapApp-SPM'"

`npx cap add ios` generates an Xcode project that references `CapApp-SPM` via
Swift Package Manager (SPM).  Xcode then tries to resolve that package from the
network on every machine that opens the project.  This fails because:

- The resolved SPM cache only exists on the machine that ran `npx cap add ios`
- **Resetting Package Caches / Resolve Package Versions does NOT fix it** — the
  broken reference is baked into `project.pbxproj` and must be deleted from that
  file before Xcode ever opens the project.

**The fix:** strip all SPM references from `project.pbxproj` with
`ios/fix-spm.sh`, then use CocoaPods (via `pod install`) to manage all
Capacitor dependencies instead.  CocoaPods produces an `.xcworkspace` file that
already has everything linked correctly.

---

## ⚠️  Critical rule: ALWAYS open the `.xcworkspace`, never the `.xcodeproj`

```
✅  open ios/App/App.xcworkspace
❌  open ios/App/App.xcodeproj   ← this bypasses CocoaPods and breaks the build
```

If Xcode is already open with `.xcodeproj`, close it completely before
following the steps below.

---

## Full clean setup (run every time you recreate the iOS folder)

```bash
# 0. Make sure deps and the web bundle are up-to-date
npm install
npm run build

# 1. Wipe any previous iOS project (do this from the repo root)
rm -rf ios/

# 2. Regenerate a fresh Capacitor iOS project
npx cap add ios

# 3. ⚠️  STRIP ALL SPM REFERENCES — must be done before opening Xcode
bash ios/fix-spm.sh

# 4. Install CocoaPods dependencies (Podfile is already committed in ios/App/)
cd ios/App
pod install
cd ../..

# 5. Sync Capacitor config + web assets into the native project
npx cap sync ios

# 6. Open the WORKSPACE (not the project)
open ios/App/App.xcworkspace
```

After step 4 you will have `ios/App/App.xcworkspace` — that is the file you
must always open in Xcode.

---

## If you already have an iOS folder but the build is broken

You don't necessarily need to delete everything.  If the pbxproj is the only
problem:

```bash
# Close Xcode completely first!
bash ios/fix-spm.sh
cd ios/App && pod install && cd ../..
npx cap sync ios
open ios/App/App.xcworkspace
```

Then in Xcode: **Product → Clean Build Folder** (⇧⌘K) → **Run** (⌘R).

---

## Add the ASWebAuth plugin to Xcode (required — do not skip)

The plugin source files live in `ios/App/App/Plugins/`.  You must tell Xcode to
compile them as part of the App target.

1. Open `App.xcworkspace` in Xcode
2. In the **Project Navigator** (left panel) expand **App → App**
3. If a `Plugins` group already exists:
   - Click `ASWebAuth.swift` → open **File Inspector** (⌥⌘1, right panel)
   - Under **Target Membership** check ☑ **App**
   - Repeat for `ASWebAuth.m`
4. If the `Plugins` group does NOT exist:
   - Right-click the `App` folder → **Add Files to "App"…**
   - Navigate into `Plugins/` → select `ASWebAuth.swift` and `ASWebAuth.m`
   - Tick ☑ **Add to targets: App** → **Add**
5. Verify: **App target → Build Phases → Compile Sources** — both files must
   appear in the list.  If not, drag them in from the Project Navigator.
6. **Product → Clean Build Folder** (⇧⌘K) → **Run** (⌘R)
7. In the Xcode console you should see:
   ```
   [Auth] Available Capacitor plugins: [..., "ASWebAuth", ...]
   ```

> If ASWebAuth is still missing the app automatically falls back to the
> Capacitor Browser plugin (SFSafariViewController) which also works — auth
> succeeds via the `rovr://` deep-link either way.

---

## Add the `rovr://` URL scheme

1. Select the **App** project → **App** target → **Info** tab
2. Scroll to **URL Types** → **+**
3. Fill in:
   | Field | Value |
   |---|---|
   | Identifier | `app.travelrovr.app` |
   | URL Schemes | `rovr` |
   | Role | Editor |

---

## Build & verify checklist

- [ ] Opened `App.xcworkspace` (not `App.xcodeproj`)
- [ ] `pod install` completed without errors
- [ ] `npx cap sync ios` completed without errors
- [ ] Both `ASWebAuth.swift` and `ASWebAuth.m` are in **Compile Sources**
- [ ] `rovr` URL scheme is set in **Info → URL Types**
- [ ] Clean Build Folder (⇧⌘K) → Run (⌘R) → console shows `ASWebAuth` in plugin list

---

## Auth flow summary

```
User is unauthenticated
  → navigateToLogin() detects native platform
  → Capacitor Browser.open() opens SFSafariViewController
  → Full Base44 login page loads (Google, Apple, email/password, signup, forgot password)
  → User signs in
  → Base44 redirects → https://travelrovr.base44.app/?access_token=<token>
  → appUrlOpen listener in main.jsx fires with rovr:// deep-link OR
    handleTokenFromUrl() parses token from redirect URL
  → Token stored in localStorage
  → Browser.close() dismisses the SFSafariViewController
  → 'base44:token-received' event fires → checkAppState() → logged in ✅
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing package product 'CapApp-SPM'` | Close Xcode → `bash ios/fix-spm.sh` → `pod install` → open `.xcworkspace` |
| Build fails immediately after `npx cap add ios` | You opened `.xcodeproj` — always use `.xcworkspace` |
| `Available plugins: [...] — no ASWebAuth` | Files not in Compile Sources — follow "Add the ASWebAuth plugin" steps |
| `Failed to start ASWebAuthenticationSession` | Run on simulator or physical device (iOS ≥ 14); not Mac Catalyst |
| Token not found after sign-in | Confirm `rovr` URL scheme is in Info → URL Types |
| Deep-link `rovr://` not received | Same as above |
| `pod install` fails with "Unable to find a specification for Capacitor" | Run `npm install` first so `node_modules/@capacitor` exists |