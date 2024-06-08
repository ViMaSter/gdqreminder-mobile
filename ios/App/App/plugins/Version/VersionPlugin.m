#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(VersionPlugin, "Version",
  CAP_PLUGIN_METHOD(getCurrent, CAPPluginReturnPromise);
)
