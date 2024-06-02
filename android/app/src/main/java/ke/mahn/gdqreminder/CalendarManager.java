package ke.mahn.gdqreminder;

import static androidx.core.content.PermissionChecker.PERMISSION_GRANTED;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CalendarManager {
    // event projection array
    private static final String[] EVENT_PROJECTION = new String[] {
        CalendarContract.Events._ID,
        CalendarContract.Events._SYNC_ID,
        CalendarContract.Events.TITLE,
        CalendarContract.Events.EVENT_LOCATION,
        CalendarContract.Events.DESCRIPTION,
        CalendarContract.Events.DTSTART,
        CalendarContract.Events.DTEND
    };
    private static final int PROJECTION_ID_INDEX = 0;
    private static final int PROJECTION_SYNC_ID_INDEX = 1;
    private static final int PROJECTION_TITLE_INDEX = 2;
    private static final int PROJECTION_LOCATION_INDEX = 3;
    private static final int PROJECTION_DESCRIPTION_INDEX = 4;
    @SuppressWarnings("SpellCheckingInspection")
    private static final int PROJECTION_DTSTART_INDEX = 5;
    @SuppressWarnings("SpellCheckingInspection")
    private static final int PROJECTION_DTEND_INDEX = 6;
    public static int code = 0xca13;
    static String accountName = "GDQReminder";
    static String accountType = BuildConfig.APPLICATION_ID + ".account";

    static boolean checkPermission(AppCompatActivity activity, Context context, int callbackId, String... permissionsId) {
        boolean permissions = true;
        for (String p : permissionsId) {
            permissions = permissions && ContextCompat.checkSelfPermission(context, p) == PERMISSION_GRANTED;
        }

        if (!permissions)
        {
            ActivityCompat.requestPermissions(activity, permissionsId, callbackId);
            return false;
        }
        return true;
    }

    public static long InsertCalendarIfMissing(Context context) {
        ContentResolver resolver = context.getContentResolver();
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

    static String internalCleanupEvents(Context context, ArrayList<String> sync_idsToKeep) throws JSONException {
        long calendarID = InsertCalendarIfMissing(context);
        if (calendarID == -1) {
            return "calendar missing";
        }

        JSObject allEvents = internalGetAllEvents(context);
        Map<String, String> sync_idToId = new HashMap<>();
        for (int i = 0; i < allEvents.getJSONArray("events").length(); i++) {
            JSONObject event = allEvents.getJSONArray("events").getJSONObject(i);
            sync_idToId.put(event.getString("pk"), event.getString("id"));
        }

        for (String sync_id : sync_idToId.keySet()) {
            if(sync_idsToKeep.contains(sync_id)) {
                continue;
            }
            Uri deleteUri = CalendarContract.Events.CONTENT_URI.buildUpon()
                .appendPath(sync_idToId.get(sync_id))
                .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, accountName)
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, accountType)
                .build();
            int deleted = context.getContentResolver().delete(deleteUri, null, null);
            System.out.println("Event deleted: " + deleted);
        }
        return "";
    }

    public static String internalUpsertEvent(Context context, long calendarID, String sync_id, long startTime, long endTime, String title, String description, String location) {
        Cursor cursor = context.getContentResolver().query(CalendarContract.Events.CONTENT_URI, new String[] { CalendarContract.Events._ID }, CalendarContract.Events._SYNC_ID + " = ?", new String[] { sync_id }, null);
        if (cursor != null && cursor.moveToFirst()) {
            return UpdateEvent(context, calendarID, cursor.getLong(0), startTime, endTime, title, description, location);
        }

        return CreateEvent(context, calendarID, sync_id, startTime, endTime, title, description, location);
    }

    private static String UpdateEvent(Context context, long calendarID, long eventID, long startTime, long endTime, String title, String description, String location) {
        ContentValues cv = new ContentValues();
        cv.put(CalendarContract.Events.DTSTART, startTime);
        cv.put(CalendarContract.Events.DTEND, endTime);
        cv.put(CalendarContract.Events.TITLE, title);
        cv.put(CalendarContract.Events.DESCRIPTION, description);
        cv.put(CalendarContract.Events.EVENT_LOCATION, location);
        cv.put(CalendarContract.Events.CALENDAR_ID, calendarID);
        cv.put(CalendarContract.Events.EVENT_TIMEZONE, "UTC");

        ContentResolver resolver = context.getContentResolver();
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
            System.out.println("Event updated: " + cv);
            return "";
        } catch (Exception e) {
            System.out.println("Error updating event: " + e.getMessage());
            return e.getMessage();
        }
    }

    private static String CreateEvent(Context context, long calendarID, String sync_id, long startTime, long endTime, String title, String description, String location) {
        ContentValues cv = new ContentValues();
        cv.put(CalendarContract.Events.DTSTART, startTime);
        cv.put(CalendarContract.Events.DTEND, endTime);
        cv.put(CalendarContract.Events.TITLE, title);
        cv.put(CalendarContract.Events.DESCRIPTION, description);
        cv.put(CalendarContract.Events.EVENT_LOCATION, location);
        cv.put(CalendarContract.Events.CALENDAR_ID, calendarID);
        cv.put(CalendarContract.Events._SYNC_ID, sync_id);
        cv.put(CalendarContract.Events.EVENT_TIMEZONE, "UTC");

        ContentResolver resolver = context.getContentResolver();
        Uri eventUri = CalendarContract.Events.CONTENT_URI;
        eventUri = eventUri.buildUpon()
                .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, accountName)
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, accountType)
                .build();

        try {
            Uri created = resolver.insert(eventUri, cv);
            System.out.println("Event created: " + created);
            System.out.println("Event created: " + cv);
            return "";
        } catch (Exception e) {
            System.out.println("Error creating event: " + e.getMessage());
            return e.getMessage();
        }
    }

    public static JSObject internalGetAllEvents(Context context)
    {
        long calendarID = InsertCalendarIfMissing(context);
        if (calendarID == -1) {
            JSObject ret = new JSObject();
            ret.put("events", new JSArray());
            ret.put("error", "Permission denied");
            return ret;
        }
        System.out.println("calendarID: " + calendarID);

        Cursor cursor = context.getContentResolver().query(CalendarContract.Events.CONTENT_URI, EVENT_PROJECTION, CalendarContract.Events.CALENDAR_ID + " = ?", new String[] { String.valueOf(calendarID) }, null);
        JSArray array = new JSArray();
        if (cursor == null) {
            JSObject ret = new JSObject();
            ret.put("events", array);
            ret.put("error", "no cursor");
            return ret;
        }
        while (cursor.moveToNext()) {
            JSObject event = new JSObject();
            event.put("id", cursor.getString(PROJECTION_ID_INDEX));
            event.put("pk", cursor.getString(PROJECTION_SYNC_ID_INDEX));
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
        ret.put("error", "");
        return ret;
    }

    public static void RefreshCalendarData(Context context) {
        try {
            URL uri = new URL("https://gamesdonequick.com/tracker/api/v1/search/?type=event&datetime_gte=" + Instant.now().toString());
            HttpURLConnection connection = (HttpURLConnection) uri.openConnection();
            connection.setRequestMethod("GET");
            connection.connect();
            int responseCode = connection.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                throw new Exception("event HTTP response code: " + responseCode);
            }

            InputStream inputStream = connection.getInputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            inputStream.close();
            JSArray events = new JSArray(response.toString());
            String currentShort = events.getJSONObject(0).getJSONObject("fields").getString("short");
            uri = new URL("https://gamesdonequick.com/tracker/api/v1/search/?type=run&eventshort=" + currentShort);
            connection = (HttpURLConnection) uri.openConnection();
            connection.setRequestMethod("GET");
            connection.connect();
            responseCode = connection.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                throw new Exception("run HTTP response code: " + responseCode);
            }
            inputStream = connection.getInputStream();
            reader = new BufferedReader(new InputStreamReader(inputStream));
            response = new StringBuilder();
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            inputStream.close();
            JSONArray runs = new JSONArray(response.toString());
            JSONArray trackedPKs = internalGetAllEvents(context).getJSONArray("events");
            List<String> trackedPKsList = new ArrayList<>();
            for (int i = 0; i < trackedPKs.length(); i++) {
                trackedPKsList.add(trackedPKs.getJSONObject(i).getString("pk"));
            }

            for (int i = 0; i < runs.length(); i++) {
                JSONObject fields = runs.getJSONObject(i).getJSONObject("fields");
                String pk = runs.getJSONObject(i).getString("pk");

                if (!trackedPKsList.contains(pk)) {
                    continue;
                }

                internalUpsertEvent(
                        context,
                        InsertCalendarIfMissing(context),
                        runs.getJSONObject(i).getString("pk"),
                        Instant.parse(fields.getString("starttime")).toEpochMilli(),
                        Instant.parse(fields.getString("endtime")).toEpochMilli(),
                        fields.getString("display_name"),
                        fields.getString("description"),
                        fields.getString("setup_time")
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
