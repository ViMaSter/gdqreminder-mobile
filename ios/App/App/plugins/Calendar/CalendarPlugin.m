#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(CalendarPlugin, "Calendar",
  CAP_PLUGIN_METHOD(upsertEvent, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(cleanupEvents, CAPPluginReturnPromise);
)
