import Foundation
import Capacitor

@objc(VersionPlugin)
public class VersionPlugin: CAPPlugin, CAPBridgedPlugin {
    
  private let implementation = Version()

    public let identifier = "VersionPlugin"
    public let jsName = "Version"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "Version", returnType: CAPPluginReturnPromise)
    ]

    @objc func getCurrent(_ call: CAPPluginCall) {
      let versionCode = implementation.getCurrent();
      call.resolve(["versionCode": versionCode])
    }

}
