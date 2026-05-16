# iOS ASWebAuthenticationSession Setup

## Prerequisites
The native plugin has been added at `ios/App/App/Plugins/ASWebAuth.swift`.

## Xcode Configuration (Required)

### 1. **URL Scheme Registration**
1. Open `ios/App/App.xcodeproj` in Xcode
2. Select **App** → **Targets** → **App**
3. Go to **Info** tab
4. Under **URL Types**, click **+** to add a new URL scheme
5. Set **Identifier**: `com.rovr.oauth`
6. Set **URL Schemes**: `rovr`
7. Save

**Result**: Your app will now handle `rovr://` deep-links from the OAuth callback.

### 2. **Info.plist Entries** (Usually auto-generated)
Verify these are in `ios/App/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.rovr.oauth</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>rovr</string>
    </array>
  </dict>
</array>
```

### 3. **Associated Domains** (Optional, for universal links)
If you need to support `https://travelrovr.base44.app/callback`:

1. Select **App** → **Signing & Capabilities**
2. Click **+ Capability** → **Associated Domains**
3. Add: `applinks:travelrovr.base44.app`
4. Host an `apple-app-site-association` file at `https://travelrovr.base44.app/.well-known/apple-app-site-association`

(Usually not needed for OAuth via `rovr://` scheme)

### 4. **Plugin Auto-Registration**
Capacitor should auto-register the plugin. If not, manually add to `ios/App/App/Podfile`:

```ruby
pod 'Capacitor'
pod 'CapacitorCommunity/Http'
# ASWebAuth is built-in to AuthenticationServices (iOS 12+)
```

Run: `npx cap sync ios`

## Build & Run

```bash
npx cap sync ios
# Then open in Xcode and run on device/simulator
```

## Testing

The OAuth flow will now:
1. Open a **native Safari-like browser** (ASWebAuthenticationSession)
2. User signs in with Google
3. Google redirects to `rovr://travelrovr.base44.app/callback?token=...`
4. System calls your app's URL handler
5. `main.jsx` extracts token and stores it
6. Auth flow completes ✓

**This is 100% Google-compliant — not a WKWebView, not embedded.**

## Troubleshooting

- **"Plugin not found"**: Run `npx cap sync ios` and rebuild
- **"Failed to start auth session"**: Check Xcode console for errors
- **Still getting 403**: Verify Base44 auth endpoint is serving the correct `User-Agent` for iOS Safari