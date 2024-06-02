package ke.mahn.gdqreminder;

import android.Manifest;

import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "Calendar")
public class CalendarPlugin extends Plugin {

    @Override
    public void load() {
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(RefreshTimesForCurrentEvent.class, 15, TimeUnit.MINUTES).build();
        WorkManager.getInstance(getContext()).enqueueUniquePeriodicWork("RefreshTimesForCurrentEvent", ExistingPeriodicWorkPolicy.UPDATE, request);

        Runnable runnable = () -> CalendarManager.RefreshCalendarData(getContext());

        new Thread(runnable).start();
    }

    @PluginMethod
    public void cleanupEvents(PluginCall call) throws JSONException {
        if (!CalendarManager.checkPermission(getActivity(), getContext(), CalendarManager.code, Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR))
        {
            JSObject ret = new JSObject();
            ret.put("error", "calendar missing");
            call.resolve(ret);
            return;
        }

        long calendarID = CalendarManager.InsertCalendarIfMissing(getContext());
        if (calendarID == -1) {
            JSObject ret = new JSObject();
            ret.put("error", "calendar missing");
            call.resolve(ret);
            return;
        }
        
        ArrayList<String> sync_idsToKeep = new ArrayList<>();
        JSArray sync_ids = call.getArray("sync_ids");
        for (int i = 0; i < sync_ids.length(); i++) {
            sync_idsToKeep.add(sync_ids.getString(i));
        }
        String response = CalendarManager.internalCleanupEvents(getContext(), sync_idsToKeep);
        call.resolve(new JSObject().put("error", response));
    }

    @PluginMethod()
    public void upsertEvent(PluginCall call) {
        if (!CalendarManager.checkPermission(getActivity(), getContext(), CalendarManager.code, Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR))
        {
            JSObject ret = new JSObject();
            ret.put("error", "missing permissions");
            call.resolve(ret);
            return;
        }

        long calendarID = CalendarManager.InsertCalendarIfMissing(getContext());
        if (calendarID == -1) {
            JSObject ret = new JSObject();
            ret.put("error", "calendar missing");
            call.resolve(ret);
            return;
        }

        
        call.resolve(new JSObject().put("error", CalendarManager.internalUpsertEvent(
            getContext(), 
            calendarID, 
            call.getString("sync_id"),
            Instant.parse(call.getString("startDate")).toEpochMilli(),
            Instant.parse(call.getString("endDate")).toEpochMilli(),
            call.getString("title"), 
            call.getString("notes"), 
            call.getString("location")
        )));
        return;
    }


    @PluginMethod()
    public void getAllEvents(PluginCall call) {
        if (!CalendarManager.checkPermission(getActivity(), getContext(), CalendarManager.code, Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR))
        {
            return;
        }

        call.resolve(CalendarManager.internalGetAllEvents(getContext()));
    }

}