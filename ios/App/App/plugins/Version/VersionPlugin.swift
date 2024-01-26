import Foundation
import Capacitor

@objc(VersionPlugin)
public class VersionPlugin: CAPPlugin {

    private let implementation = Version()

    @objc public func getCurrent(_ call: CAPPluginCall) {
      call.resolve(implementation.getCurrent())
    }

    /* Remaining code omitted for brevity */
}
