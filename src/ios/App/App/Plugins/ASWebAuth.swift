import Capacitor
import AuthenticationServices
import UIKit

@objc(ASWebAuth)
public class ASWebAuth: CAPPlugin, ASWebAuthenticationPresentationContextProviding {

    private var authSession: ASWebAuthenticationSession?
    // Keep the call alive until the session finishes
    private var savedCall: CAPPluginCall?

    @objc
    func open(_ call: CAPPluginCall) {
        call.keepAlive = true            // Required – prevents Capacitor GC-ing the call

        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("Invalid or missing url parameter")
            return
        }

        let scheme = call.getString("callbackScheme") ?? "rovr"
        savedCall = call

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            self.authSession = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: scheme
            ) { [weak self] callbackURL, error in
                guard let self = self else { return }

                defer {
                    self.authSession = nil
                    self.savedCall = nil
                }

                if let error = error {
                    let nsError = error as NSError
                    // ASWebAuthenticationSessionErrorCode.canceledLogin == 1
                    if nsError.code == 1 {
                        call.reject("canceledByUser")
                    } else {
                        call.reject("Authentication failed: \(error.localizedDescription)")
                    }
                    return
                }

                if let callbackURL = callbackURL {
                    call.resolve(["url": callbackURL.absoluteString])
                } else {
                    call.reject("No callback URL received")
                }
            }

            self.authSession?.presentationContextProvider = self
            self.authSession?.prefersEphemeralWebBrowserSession = false   // Allow SSO cookies

            guard self.authSession?.start() == true else {
                call.reject("Failed to start ASWebAuthenticationSession")
                self.authSession = nil
                self.savedCall = nil
                return
            }
        }
    }

    // MARK: – ASWebAuthenticationPresentationContextProviding
    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        // Safe for iOS 13+; SceneDelegate-based apps will have keyWindow via connectedScenes
        if let windowScene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first(where: { $0.activationState == .foregroundActive }),
           let window = windowScene.windows.first(where: { $0.isKeyWindow }) {
            return window
        }
        // Fallback for apps without SceneDelegate
        return UIApplication.shared.windows.first { $0.isKeyWindow } ?? UIWindow()
    }
}