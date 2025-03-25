import UIKit
import React_Core
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UserNotifications
import Firebase
import Notifee

@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    self.moduleName = "NotificationExpoTest"
    self.dependencyProvider = RCTAppDependencyProvider()

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]

    // Initialisation de Firebase
    if FirebaseApp.app() == nil {
        FirebaseApp.configure()
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

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
