package ke.mahn.gdqreminder;
import ke.mahn.gdqreminder.BuildConfig;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Calendar")
public class CalendarPlugin extends Plugin {

    @PluginMethod()
    public void getAllEvents(PluginCall call) {
        JSObject event1 = new JSObject();
        event1.put("title", "Event 1");
        event1.put("location", "Location 1");
        event1.put("notes", "Notes 1");
        event1.put("startDate", "2024-05-31T00:00:00Z");
        event1.put("endDate", "2024-05-31T01:00:00Z");

        JSObject event2 = new JSObject();
        event2.put("title", "Event 2");
        event2.put("location", "Location 2");
        event2.put("notes", "Notes 2");
        event2.put("startDate", "2024-06-01T00:00:00Z");
        event2.put("endDate", "2024-06-01T01:00:00Z");

        JSArray array = new JSArray();
        array.put(event1);
        array.put(event2);

        JSObject ret = new JSObject();
        ret.put("events", array);
        
        call.resolve(ret);
    }

    @PluginMethod()
    public void createEvent(PluginCall call) {
        System.out.println("title: " + call.getString("title"));
        System.out.println("location: " + call.getString("location"));
        System.out.println("notes: " + call.getString("notes"));
        System.out.println("startDate: " + call.getString("startDate"));
        System.out.println("endDate: " + call.getString("endDate"));
        
        // returns true if date is tomorrow
        JSObject ret = new JSObject();
        ret.put("success", call.getString("startDate").startsWith("2024-06-01"));
        call.resolve(ret);
    }
}