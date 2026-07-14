package ke.mahn.gdqreminder;

import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SafeArea")
public class SafeAreaPlugin extends Plugin {

    @PluginMethod()
    public void getSafeAreaInsets(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            View webView = getBridge().getWebView();
            WindowInsetsCompat windowInsets = ViewCompat.getRootWindowInsets(webView);

            JSObject result = new JSObject();
            if (windowInsets == null) {
                result.put("top", 0);
                result.put("right", 0);
                result.put("bottom", 0);
                result.put("left", 0);
                call.resolve(result);
                return;
            }

            Insets safeInsets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );

            float density = webView.getResources().getDisplayMetrics().density;
            if (density <= 0) {
                density = 1;
            }

            result.put("top", safeInsets.top / density);
            result.put("right", safeInsets.right / density);
            result.put("bottom", safeInsets.bottom / density);
            result.put("left", safeInsets.left / density);
            call.resolve(result);
        });
    }
}
