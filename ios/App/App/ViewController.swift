//
//  ViewController.swift
//  App
//
//  Created by Vincent Mahnke on 08.06.24.
//

import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(VersionPlugin())
        bridge?.registerPluginInstance(CalendarPlugin())
    }
}
