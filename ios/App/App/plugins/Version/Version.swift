import Foundation
import UIKit

public class Version: NSObject {

  public func getCurrent() -> [String: String] {
      return [
        "versionCode": Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "code n/a",
        "versionName": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "name n/a"
      ]
  }
    
}
