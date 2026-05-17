# ROVR iOS – Clean Setup Guide

## The CapApp-SPM problem

Capacitor 6's `npx cap add ios` generates an Xcode project that references
`CapApp-SPM` (Swift Package Manager).  That SPM package resolves fine on the
machine that ran `npx cap add ios`, but fails on every other machine because
Xcode tries to re-resolve it from the network and the cache is missing.

**Fix: delete the generated iOS project and regenerate it with CocoaPods,
then add our custom plugin files.**

---

## One-time setup (run these in order)

```bash
# 0. Install project deps and build the web bundle
npm install
npm run build

# 1. Remove any previously generated iOS project
rm -rf ios/

# 2. Re-generate a fresh iOS project
npx cap add ios

# 3. ⚠️  CRITICAL: Strip the stale CapApp-SPM reference from the pbxproj
#    (npx cap add ios injects an SPM dependency that breaks on other machines)
bash ios/fix-spm.sh

# 4. Install CocoaPods dependencies
#    (the Podfile is already committed to the repo at ios/App/Podfile)
cd ios/App
pod install
cd ../..

# 5. Sync Capacitor config + web assets
npx cap sync ios
```

After `pod install` you will have `ios/App/App.xcworkspace`.
**Always open the `.xcworkspace`, never the `.xcodeproj`.**

> **If Xcode still shows "Missing package product CapApp-SPM"** after following
> the steps above, it means the project was opened before running `fix-spm.sh`.
> Close Xcode, run `fix-spm.sh`, then `pod install`, then re-open the workspace.
> "Reset Package Caches" in Xcode will NOT help — the reference must be deleted
> from the pbxproj itself.

---

## Add the ASWebAuth plugin to Xcode

The two plugin files are committed to `ios/App/App/Plugins/`:

```
ios/App/App/Plugins/ASWebAuth.swift
ios/App/App/Plugins/ASWebAuth.m
```

In Xcode (with `App.xcworkspace` open):

1. In the Project Navigator expand **App → App**
2. Right-click the `App` folder → **Add Files to "App"…**
3. Navigate into `Plugins/`, select **both files**
4. Tick ☑ **Copy items if needed** and ☑ **Add to targets: App**
5. Click **Add**
6. Confirm both files appear under  
   **TARGETS → App → Build Phases → Compile Sources**

---

## Add the URL scheme

In Xcode:

1. Select the **App** project → **App** target → **Info** tab
2. Scroll to **URL Types** → **+**
3. Set:
   - **Identifier**: `app.travelrovr.app`
   - **URL Schemes**: `rovr`
   - **Role**: Editor

---

## Set the required environment variable

In a `.env` file (or Vite config):

```
VITE_APP_PUBLIC_URL=https://travelrovr.base44.app
```

---

## Build & verify

1. Open `ios/App/App.xcworkspace` in Xcode
2. **Product → Clean Build Folder** (⇧⌘K)
3. Select simulator or device → **Run** (⌘R)
4. Watch console for:
   ```
   [Auth] Available Capacitor plugins: [..., ASWebAuth, ...]
   ```

---

## Auth flow summary

```
Tap "Sign in with Google"
  → ASWebAuth.open({ url: "https://base44.com/auth?...", callbackScheme: "rovr" })
  → iOS opens ASWebAuthenticationSession (native Safari sheet)
  → Google sign-in completes
  → Base44 redirects → https://travelrovr.base44.app/?access_token=<token>
  → Swift completion handler resolves with { url: "https://...?access_token=..." }
  → AuthContext extracts token → localStorage → checkUserAuth() → logged in ✅
```

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Missing package product 'CapApp-SPM'` | Close Xcode → run `bash ios/fix-spm.sh` → `pod install` → re-open `.xcworkspace` |
| `ASWebAuth plugin not found` | Both `.swift` + `.m` must be in Compile Sources; clean build |
| `Failed to start ASWebAuthenticationSession` | Run on simulator/device, not Catalyst; iOS ≥ 14 |
| Token not found after auth | Check `VITE_APP_PUBLIC_URL` matches your Base44 published domain |