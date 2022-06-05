package ke.mahn.gdqreminder;
import ke.mahn.gdqreminder.BuildConfig;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Version")
public class VersionPlugin extends Plugin {

    @PluginMethod()
    public void getCurrent(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("versionCode", BuildConfig.VERSION_CODE);
        ret.put("versionName", BuildConfig.VERSION_NAME);
        call.resolve(ret);
    }
}