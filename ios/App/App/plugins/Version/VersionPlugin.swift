import Foundation
import Capacitor

@objc(VersionPlugin)
public class VersionPlugin: CAPPlugin {

    private let implementation = Version()

    @objc public func getCurrent(_ call: CAPPluginCall) {
      let orientationType = implementation.getCurrent();
      call.resolve(["versionCode": 123, "versionName": orientationType])
    }

    /* Remaining code omitted for brevity */
}
