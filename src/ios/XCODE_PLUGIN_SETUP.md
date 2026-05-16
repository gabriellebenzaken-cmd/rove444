# iOS ASWebAuth Plugin - Xcode Setup

## Problem
`ASWebAuthPlugin` is not appearing in `window.Capacitor.Plugins` on iOS.

## Solution

### Step 1: Verify File Location
The plugin file must be at:
```
ios/App/App/Plugins/ASWebAuth.swift
```

✓ Confirmed created at correct path.

### Step 2: Add to Xcode Target Membership

1. **Open Xcode**:
   ```bash
   open ios/App/App.xcworkspace
   ```

2. **Locate the file**:
   - In Xcode's Project Navigator (left sidebar)
   - Expand: `App` → `Plugins`
   - Click `ASWebAuth.swift`

3. **Add to Target**:
   - Right panel → **File Inspector**
   - Under **Target Membership**, check the **`App` checkbox**
   - If not visible, click the checkbox next to `App`

### Step 3: Verify Build Phases

1. Select **App** target
2. Go to **Build Phases** tab
3. Expand **Compile Sources**
4. **Verify** `Plugins/ASWebAuth.swift` is listed
5. If missing, click **+** and add it

### Step 4: Clean & Rebuild

```bash
cd ios/App
rm -rf Pods build .xcworkspace
cd ../..
npx cap sync ios
# Then in Xcode: Product → Clean Build Folder (Cmd+Shift+K)
# Then: Product → Build (Cmd+B)
```

### Step 5: Verify Plugin Registration

Run the app and check Xcode console on login attempt. Should log:
```
[Auth] Available plugins: CapacitorHttp, Console, WebView, CapacitorCookies, SystemBars, Browser, ASWebAuth
```

If `ASWebAuth` appears in the list, setup is complete ✓

## If Still Missing

- **Check Swift compiler settings**: Target → Build Settings → Swift Compiler Language
- **Verify iOS deployment target**: Target → Build Settings → `IPHONEOS_DEPLOYMENT_TARGET` ≥ 12.0 (required for ASWebAuthenticationSession)
- **Check for build errors**: Product → Build (check console for Swift compile errors)