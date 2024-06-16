import Foundation
import Capacitor

@objc(CalendarPlugin)
public class CalendarPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "CalendarPlugin"
    public let jsName = "Calendar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "upsertEvent", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cleanupEvents", returnType: CAPPluginReturnPromise)
    ]
    
    @objc func upsertEvent(_ call: CAPPluginCall) {
      call.resolve(["error": ""])
    }
    
    @objc func cleanupEvents(_ call: CAPPluginCall) {
      call.resolve(["error": ""])
    }

}
