package ke.mahn.gdqreminder;
import static androidx.core.content.PermissionChecker.PERMISSION_GRANTED;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import android.provider.ContactsContract;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import ke.mahn.gdqreminder.BuildConfig;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.time.Instant;
import java.util.Calendar;
import java.util.Objects;

@CapacitorPlugin(name = "Calendar")
public class CalendarPlugin extends Plugin {

    public static int code = 0xca13;

    private boolean checkPermission(int callbackId, String... permissionsId) {
        boolean permissions = true;
        for (String p : permissionsId) {
            permissions = permissions && ContextCompat.checkSelfPermission(getContext(), p) == PERMISSION_GRANTED;
        }

        if (!permissions)
        {
            ActivityCompat.requestPermissions(getActivity(), permissionsId, callbackId);
            return false;
        }
        return true;
    }

    String accountName = "GDQReminder";
    String accountType = BuildConfig.APPLICATION_ID + ".account";

    public long InsertCalendarIfMissing() {
        if (!checkPermission(code, Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR))
        {
            return -1;
        }

        ContentResolver resolver = getContext().getContentResolver();
        Uri calUri = CalendarContract.Calendars.CONTENT_URI;

        String[] projection = new String[] { CalendarContract.Calendars._ID };
        Cursor cursor = resolver.query(calUri, projection, CalendarContract.Calendars.ACCOUNT_NAME + " = ?", new String[] { accountName }, null);

        // if we have one GDQ calendar return and destroy any other calendars
        if (cursor != null && cursor.moveToFirst()) {
            long firstCalenderID = cursor.getLong(0);
            
            while (cursor.moveToNext()) {
                long id = cursor.getLong(0);
                Uri deleteUri = CalendarContract.Calendars.CONTENT_URI.buildUpon()
                    .appendPath(Long.toString(id))
                    .build();
                resolver.delete(deleteUri, null, null);
            }
            cursor.close();
            return firstCalenderID;
        }

        ContentValues cv = new ContentValues();
        cv.put(CalendarContract.Calendars.ACCOUNT_NAME, accountName);
        cv.put(CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL);
        cv.put(CalendarContract.Calendars.NAME, accountName);
        cv.put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, accountName);
        cv.put(CalendarContract.Calendars.CALENDAR_COLOR, 0x7b1bdc);
        cv.put(CalendarContract.Calendars.VISIBLE, 1);
        cv.put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, CalendarContract.Calendars.CAL_ACCESS_OWNER);
        cv.put(CalendarContract.Calendars.OWNER_ACCOUNT, accountName );
        cv.put(CalendarContract.Calendars.SYNC_EVENTS, 0);
        calUri = calUri.buildUpon()
                .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, accountName)
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, accountType)
                .build();

        try {
            Uri created = resolver.insert(calUri, cv);
            System.out.println("Calendar created: " + created);
            return Integer.parseInt(created.getLastPathSegment());
        } catch (Exception e) {
            System.out.println("Error creating calendar: " + e.getMessage());
            return -1;
        }
    }

    @PluginMethod
    public void removeEvent(PluginCall call) {
        long calendarID = InsertCalendarIfMissing();
        if (calendarID == -1) {
            JSObject ret = new JSObject();
            ret.put("error", "calendar missing");
            call.resolve(ret);
            return;
        }

        String sync_id = call.getString("sync_id");
        Cursor cursor = getContext().getContentResolver().query(CalendarContract.Events.CONTENT_URI, new String[] { CalendarContract.Events._ID }, CalendarContract.Events._SYNC_ID + " = ?", new String[] { sync_id }, null);
        if (cursor != null && cursor.moveToFirst()) {
            long eventID = cursor.getLong(0);
            Uri deleteUri = CalendarContract.Events.CONTENT_URI.buildUpon()
                    .appendPath(Long.toString(eventID))
                    .build();
            int deleted = getContext().getContentResolver().delete(deleteUri, null, null);
            System.out.println("Event deleted: " + deleted);
            JSObject ret = new JSObject();
            ret.put("error", "");
            call.resolve(ret);
            return;
        }

        JSObject ret = new JSObject();
        ret.put("error", "event not found");
        call.resolve(ret);
    }

    @PluginMethod()
    public void upsertEvent(PluginCall call) {
        long calendarID = InsertCalendarIfMissing();
        if (calendarID == -1) {
            JSObject ret = new JSObject();
            ret.put("error", "calendar missing");
            call.resolve(ret);
            return;
        }

        String sync_id = call.getString("sync_id");
        Cursor cursor = getContext().getContentResolver().query(CalendarContract.Events.CONTENT_URI, new String[] { CalendarContract.Events._ID }, CalendarContract.Events._SYNC_ID + " = ?", new String[] { sync_id }, null);
        if (cursor != null && cursor.moveToFirst()) {
            UpdateEvent(call, calendarID, cursor.getLong(0));
            return;
        }

        CreateEvent(call, calendarID);
    }

    private void UpdateEvent(PluginCall call, long calendarID, long eventID) {
        ContentValues cv = new ContentValues();
        cv.put(CalendarContract.Events.DTSTART, Instant.parse( call.getString("startDate") ).toEpochMilli());
        cv.put(CalendarContract.Events.DTEND, Instant.parse( call.getString("endDate") ).toEpochMilli());
        cv.put(CalendarContract.Events.TITLE, call.getString("title"));
        cv.put(CalendarContract.Events.DESCRIPTION, call.getString("notes"));
        cv.put(CalendarContract.Events.EVENT_LOCATION, call.getString("location"));
        cv.put(CalendarContract.Events.CALENDAR_ID, calendarID);
        cv.put(CalendarContract.Events.EVENT_TIMEZONE, "UTC");

        ContentResolver resolver = getContext().getContentResolver();
        Uri eventUri = CalendarContract.Events.CONTENT_URI;
        eventUri = eventUri.buildUpon()
                .appendPath(Long.toString(eventID))
                .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, accountName)
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, accountType)
                .build();

        try {
            int updated = resolver.update(eventUri, cv, null, null);
            System.out.println("Event updated: " + updated);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            System.out.println("Error updating event: " + e.getMessage());
            JSObject ret = new JSObject();
            ret.put("success", false);
            call.resolve(ret);
        }
    }

    private void CreateEvent(PluginCall call, long calendarID) {
        ContentValues cv = new ContentValues();
        cv.put(CalendarContract.Events.DTSTART, Instant.parse( call.getString("startDate") ).toEpochMilli());
        cv.put(CalendarContract.Events.DTEND, Instant.parse( call.getString("endDate") ).toEpochMilli());
        cv.put(CalendarContract.Events.TITLE, call.getString("title"));
        cv.put(CalendarContract.Events.DESCRIPTION, call.getString("notes"));
        cv.put(CalendarContract.Events.EVENT_LOCATION, call.getString("location"));
        cv.put(CalendarContract.Events.CALENDAR_ID, calendarID);
        cv.put(CalendarContract.Events._SYNC_ID, call.getString("sync_id"));
        cv.put(CalendarContract.Events.EVENT_TIMEZONE, "UTC");

        ContentResolver resolver = getContext().getContentResolver();
        Uri eventUri = CalendarContract.Events.CONTENT_URI;
        eventUri = eventUri.buildUpon()
                .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, accountName)
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, accountType)
                .build();

        try {
            Uri created = resolver.insert(eventUri, cv);
            System.out.println("Event created: " + created);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            System.out.println("Error creating event: " + e.getMessage());
            JSObject ret = new JSObject();
            ret.put("success", false);
            call.resolve(ret);
        }
    }

    // event projection array
    private static final String[] EVENT_PROJECTION = new String[] {
        CalendarContract.Events.TITLE,
        CalendarContract.Events.EVENT_LOCATION,
        CalendarContract.Events.DESCRIPTION,
        CalendarContract.Events.DTSTART,
        CalendarContract.Events.DTEND
    };

    private static final int PROJECTION_TITLE_INDEX = 0;
    private static final int PROJECTION_LOCATION_INDEX = 1;
    private static final int PROJECTION_DESCRIPTION_INDEX = 2;
    @SuppressWarnings("SpellCheckingInspection")
    private static final int PROJECTION_DTSTART_INDEX = 3;
    @SuppressWarnings("SpellCheckingInspection")
    private static final int PROJECTION_DTEND_INDEX = 4;

    @PluginMethod()
    public void getAllEvents(PluginCall call) {
        long calendarID = InsertCalendarIfMissing();
        if (calendarID == -1) {
            JSObject ret = new JSObject();
            ret.put("events", new JSArray());
            ret.put("error", "Permission denied");
            call.resolve(ret);
            return;
        }
        System.out.println("calendarID: " + calendarID);

        Cursor cursor = getContext().getContentResolver().query(CalendarContract.Events.CONTENT_URI, EVENT_PROJECTION, CalendarContract.Events.CALENDAR_ID + " = ?", new String[] { String.valueOf(calendarID) }, null);
        JSArray array = new JSArray();
        while (cursor.moveToNext()) {
            JSObject event = new JSObject();
            event.put("title", cursor.getString(PROJECTION_TITLE_INDEX));
            event.put("location", cursor.getString(PROJECTION_LOCATION_INDEX));
            event.put("notes", cursor.getString(PROJECTION_DESCRIPTION_INDEX));
            event.put("startDate", cursor.getString(PROJECTION_DTSTART_INDEX));
            event.put("endDate", cursor.getString(PROJECTION_DTEND_INDEX));

            array.put(event);
        }
        cursor.close();

        JSObject ret = new JSObject();
        ret.put("events", array);

        call.resolve(ret);
    }
}