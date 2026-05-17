# ROVR iOS – Clean Setup Guide

## Prerequisites
```bash
npm install
npm run build
npx cap sync ios        # copies www/ and capacitor.config into ios/
```

---

## 1. Open Xcode
```bash
npx cap open ios
```

---

## 2. Add the ASWebAuth plugin files to the Xcode project

The two files live in `ios/App/App/Plugins/`:
- `ASWebAuth.swift`
- `ASWebAuth.m`

**In Xcode:**
1. Right-click `App/App` in the Project Navigator → **Add Files to "App"…**
2. Navigate to `ios/App/App/Plugins/`, select **both files**, tick  
   ☑ **Copy items if needed** and ☑ **Add to targets: App**  
3. Click **Add**

Verify both files appear in:  
`TARGETS → App → Build Phases → Compile Sources`

---

## 3. Add the URL scheme (custom scheme callback)

1. Select the **App** project in the Navigator → **App** target → **Info** tab
2. Scroll to **URL Types** → click **+**
3. Set:
   - **Identifier**: `app.travelrovr.app`
   - **URL Schemes**: `rovr`
   - **Role**: Editor

This allows `ASWebAuthenticationSession` to hand the callback URL back to the app.

---

## 4. Set the VITE_APP_PUBLIC_URL environment variable

In `vite.config.ts` or a `.env` file:
```
VITE_APP_PUBLIC_URL=https://travelrovr.base44.app
```

This is the URL Base44 redirects back to after Google auth, and where the
`?access_token=` is appended.

---

## 5. Build & run

1. Select your **iPhone simulator or device**
2. **Product → Clean Build Folder** (⇧⌘K)
3. **Product → Run** (⌘R)
4. Watch Xcode console for:
   ```
   [Auth] Available Capacitor plugins: [..., ASWebAuth, ...]
   ```

---

## How the auth flow works

```
User taps "Sign in with Google"
  → navigateToLogin() (AuthContext.jsx)
  → ASWebAuth.open({ url: "https://base44.com/auth?...", callbackScheme: "rovr" })
  → iOS opens ASWebAuthenticationSession (native browser, SFSafariViewController)
  → User completes Google sign-in
  → Base44 redirects to https://travelrovr.base44.app/?access_token=<token>
  → ASWebAuthenticationSession sees the https:// redirect, returns full URL to Swift
  → Swift resolves the Capacitor call with { url: "https://...?access_token=<token>" }
  → AuthContext extracts token, stores in localStorage
  → checkUserAuth() validates token → user is logged in ✅
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ASWebAuth plugin not found` | Confirm both `.swift` and `.m` are in Compile Sources; clean build |
| `Failed to start ASWebAuthenticationSession` | Run on device/sim (not Catalyst); check iOS deployment target ≥ 13 |
| `canceledByUser` | User dismissed the sheet — no action needed |
| Token not found in callback | Verify `VITE_APP_PUBLIC_URL` matches the Base44 app's published domain |