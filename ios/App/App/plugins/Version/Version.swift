import Foundation
import UIKit

public class Version: NSObject {

  public func getCurrent() -> String {
    let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
    return version ?? "0.0.0"
  }

}
