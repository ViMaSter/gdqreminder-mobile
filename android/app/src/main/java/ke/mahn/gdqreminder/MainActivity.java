package ke.mahn.gdqreminder;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VersionPlugin.class);
        registerPlugin(CalendarPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        CalendarPlugin calendarPlugin = (CalendarPlugin) getBridge().getPlugin("Calendar").getInstance();

        if (requestCode != CalendarPlugin.code) {
            return;
        }
        boolean readCalendarGranted = false;
        boolean writeCalendarGranted = false;

        for (int i = 0; i < permissions.length; i++) {
            String permission = permissions[i];
            int grantResult = grantResults[i];

            if (!permission.equals(Manifest.permission.READ_CALENDAR) && !permission.equals(Manifest.permission.WRITE_CALENDAR)) {
                continue;
            }

            if (grantResult != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{permission}, CalendarPlugin.code);
                return;
            }

            if (permission.equals(Manifest.permission.READ_CALENDAR)) {
                readCalendarGranted = true;
            } else if (permission.equals(Manifest.permission.WRITE_CALENDAR)) {
                writeCalendarGranted = true;
            }
        }

        System.out.println("readCalendarGranted: " + readCalendarGranted);
        System.out.println("writeCalendarGranted: " + writeCalendarGranted);

        if (readCalendarGranted && writeCalendarGranted) {
            calendarPlugin.InsertCalendarIfMissing();
        }
    }
}
