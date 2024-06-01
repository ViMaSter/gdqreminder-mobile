package ke.mahn.gdqreminder;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.concurrent.futures.CallbackToFutureAdapter;
import androidx.work.ListenableWorker;
import androidx.work.WorkerParameters;

import com.getcapacitor.JSArray;
import com.google.common.util.concurrent.ListenableFuture;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class RefreshTimesForCurrentEvent extends ListenableWorker {
    Context context;
    public RefreshTimesForCurrentEvent(@NonNull Context appContext, @NonNull WorkerParameters workerParams) {
        super(appContext, workerParams);
        context = appContext;
    }

    @NonNull
    @Override
    public ListenableFuture<Result> startWork() {
        return CallbackToFutureAdapter.getFuture(completer -> {
            Runnable runnable = new Runnable() {
                @Override
                public void run() {
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
                        JSONArray trackedPKs = CalendarPlugin.internalGetAllEvents(context).getJSONArray("events");
                        List<String> trackedPKsList = new java.util.ArrayList<>();
                        for (int i = 0; i < trackedPKs.length(); i++) {
                            trackedPKsList.add(trackedPKs.getJSONObject(i).getString("pk"));
                        }

                        for (int i = 0; i < runs.length(); i++) {
                            JSONObject fields = runs.getJSONObject(i).getJSONObject("fields");
                            String pk = runs.getJSONObject(i).getString("pk");

                            if (!trackedPKsList.contains(pk)) {
                                continue;
                            }

                            CalendarPlugin.internalUpsertEvent(
                                    context,
                                    CalendarPlugin.InsertCalendarIfMissing(context),
                                    runs.getJSONObject(i).getString("pk"),
                                    Instant.parse(fields.getString("starttime")).toEpochMilli(),
                                    Instant.parse(fields.getString("endtime")).toEpochMilli(),
                                    fields.getString("display_name"),
                                    fields.getString("description"),
                                    fields.getString("setup_time")
                            );
                        }
                        completer.set(Result.success());
                    } catch (Exception e) {
                        e.printStackTrace();
                        completer.set(Result.failure());
                    }
                }
            };

            // Create a ThreadPoolExecutor with a single thread
            ThreadPoolExecutor executor = new ThreadPoolExecutor(1, 1, 0L, TimeUnit.MILLISECONDS, new LinkedBlockingQueue<>());
            executor.execute(runnable);

            return null;
        });
    }
}
