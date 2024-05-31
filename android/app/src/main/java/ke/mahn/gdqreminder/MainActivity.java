package ke.mahn.gdqreminder;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VersionPlugin.class);
        registerPlugin(CalendarPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
