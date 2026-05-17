#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// This file is the Objective-C bridge that registers the Swift plugin with
// Capacitor's JS layer.  The first two arguments to CAP_PLUGIN must match:
//   1. The Swift class name  → ASWebAuth
//   2. The JS plugin name    → "ASWebAuth"  (window.Capacitor.Plugins.ASWebAuth)
CAP_PLUGIN(ASWebAuth, "ASWebAuth",
  CAP_PLUGIN_METHOD(open, CAPPluginReturnPromise);
)