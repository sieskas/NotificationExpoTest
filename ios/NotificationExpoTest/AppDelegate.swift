import UIKit
import React_Core
import UserNotifications
import Firebase
import Notifee

@main
class AppDelegate: RCTAppDelegate {

    override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {

        // Initialisation de Firebase
        if FIRApp.defaultApp() == nil {
            FIRApp.configure()
        }

        // Demande de permission pour les notifications
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            if granted {
                print("Notification permission granted")
            } else {
                print("Notification permission denied")
            }
        }

        // Initialisation de Notifee
        Notifee.configure()

        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    // Méthodes pour React Native Bridge
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        self.bundleURL()
    }

    override func bundleURL() -> URL? {
        #if DEBUG
            return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
            return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
}
