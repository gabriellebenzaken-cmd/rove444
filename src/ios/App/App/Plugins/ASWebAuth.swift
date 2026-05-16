import Capacitor
import AuthenticationServices
import UIKit

@objc(ASWebAuthPlugin)
public class ASWebAuthPlugin: CAPPlugin, ASWebAuthenticationPresentationContextProviding {
    private var authSession: ASWebAuthenticationSession?
    private var callPromise: CAPPluginCall?

    @objc func open(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url") else {
            call.reject("Missing url parameter")
            return
        }
        
        guard let url = URL(string: urlString) else {
            call.reject("Invalid URL")
            return
        }
        
        let callbackScheme = call.getString("callbackScheme") ?? "rovr"
        self.callPromise = call
        
        DispatchQueue.main.async {
            self.authSession = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: callbackScheme
            ) { callbackURL, error in
                if let error = error {
                    // Check if user cancelled (error code 1)
                    let nsError = error as NSError
                    if nsError.code == 1 {
                        self.callPromise?.reject("User cancelled sign-in")
                    } else {
                        self.callPromise?.reject("Authentication failed: \(error.localizedDescription)")
                    }
                    return
                }
                
                if let callbackURL = callbackURL {
                    self.callPromise?.resolve([
                        "url": callbackURL.absoluteString
                    ])
                } else {
                    self.callPromise?.reject("No callback URL received")
                }
                
                self.authSession = nil
            }
            
            // Present the session with the app's key window
            self.authSession?.presentationContextProvider = self
            let started = self.authSession?.start() ?? false
            
            if !started {
                self.callPromise?.reject("Failed to start authentication session")
                self.authSession = nil
            }
        }
    }

    // MARK: - ASWebAuthenticationPresentationContextProviding
    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return (UIApplication.shared.delegate?.window ?? UIApplication.shared.windows.first)!
    }
}