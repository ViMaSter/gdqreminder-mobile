package ke.mahn.gdqreminder;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.concurrent.futures.CallbackToFutureAdapter;
import androidx.work.ListenableWorker;
import androidx.work.WorkerParameters;

import com.google.common.util.concurrent.ListenableFuture;

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
            Runnable runnable = () -> {
                Exception exception = CalendarManager.RefreshCalendarData(context);
                if (exception != null) {
                    completer.set(Result.failure());
                    return;
                }

                completer.set(Result.success());
            };

            ThreadPoolExecutor executor = new ThreadPoolExecutor(1, 1, 0L, TimeUnit.MILLISECONDS, new LinkedBlockingQueue<>());
            executor.execute(runnable);

            return null;
        });
    }
}
